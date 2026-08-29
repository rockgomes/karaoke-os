# Karaoke OS — the map

What exists, how it connects, and who may reach it.

Live at **https://karaoke-os.netlify.app**. See [DEPLOY.md](DEPLOY.md).

**This file is checked by CI.** `scripts/check-map.mjs` compares the `routes`
block below against the real page files. Add a page without listing it and the
build fails. So this map cannot quietly go stale.

## 0. Screens at a glance

The whole app as a list. `+` means not built yet.

**Anyone — no account**

* **Home** `/`
  * read what Karaoke OS is
  * go to venue sign in
* **Venue song list** `/v/blue-note`
  * search by song or artist
  * see whether karaoke is on tonight
  * + save a favourite (needs an account)
* **Sign in** `/login`
  * sign in
  * create a staff account

**Venue staff — sign in required**

* **Your venues** `/admin`
  * open a venue
  * *(skipped when you own exactly one)*
* **Add a venue** `/admin/new`
  * name it and claim its web address
* **Import songs** `/admin/blue-note/import`
  * choose a CSV file, or paste rows
  * see what will be imported before it happens
  * skip songs the venue already has
* **Code for the tables** `/admin/blue-note/share`
  * print a card for each table
  * copy the guest link
  * download the code as PNG or SVG
* **Manage a venue** `/admin/blue-note`
  * add a venue *(in the header, on every staff screen)*
  * open or close karaoke
  * add a song
  * edit a song
  * remove a song
  * remove several songs at once
  * search by title or artist
  * sort by title, artist, genre or year
  * page through a long list
  * fill in missing song details
  * view the guest page
  * get the QR code for the tables
  * sign out
  * + show the QR code and copy the link
  * + manage several song lists

**You — platform**

* **All venues** `/platform`
  * see every venue, its owner and its size
  * see which bars have karaoke on right now
  * suspend a venue, which hides it from guests
  * restore a suspended venue

---

## 1. The three tiers

```mermaid
flowchart TD
    G["🎤 Guest<br/>in the bar"]
    S["🍸 Venue staff<br/>owner or DJ"]
    P["🛠 Platform<br/>you"]

    G -->|"scans the QR at the table"| GP["/v/:slug<br/>the bar's song list"]
    G -.->|"optional account,<br/>only to save favourites"| FAV[("favorites")]

    S -->|"signs in"| AD["/admin/:slug<br/>manage the bar"]
    AD --> GP

    P -->|"signs in"| PA["/platform<br/>every bar"]

    PA -.->|"suspend"| AD
```

A guest needs no account. Staff need one. You are a staff account with
`is_platform_admin` set — see [SCHEMA.md](SCHEMA.md).

---

## 2. Sitemap

```mermaid
flowchart LR
    subgraph Public["Open to anyone"]
        ROOT["/"]
        VSLUG["/v/:slug"]
        LOGIN["/login"]
    end

    subgraph Staff["Sign in required"]
        ADMIN["/admin"]
        NEW["/admin/new"]
        VENUE["/admin/:slug"]
    end

    ROOT --> VSLUG
    LOGIN -->|"on success"| ADMIN
    ADMIN -->|"exactly one venue,<br/>skips the list"| VENUE
    ADMIN --> NEW
    NEW -->|"after creating"| VENUE
    VENUE -->|"view as a guest"| VSLUG
    VENUE -->|"sign out"| LOGIN
```

Every route that exists. CI checks this list.

```routes
/
/login
/admin
/admin/new
/admin/[slug]
/admin/[slug]/import
/admin/[slug]/share
/platform
/v/[slug]
```

| Route | Who | What it does |
|---|---|---|
| `/` | anyone | Landing page. Says what this is, and sends staff to sign in. |
| `/v/[slug]` | anyone | The song list a guest browses. No login. |
| `/login` | anyone | Sign in or create a staff account. |
| `/admin` | staff | Your venues. Skips straight through if you have one. |
| `/admin/new` | staff | Create a venue and become its owner. |
| `/admin/[slug]` | staff of that venue | Songs, and open or close karaoke. |
| `/admin/[slug]/import` | staff of that venue | Load a CSV of songs, with a preview first. |
| `/admin/[slug]/share` | staff of that venue | The QR code and link guests use. Printable. |
| `/platform` | platform staff only | Every venue, with the power to suspend one. |

---

## 3. Data model

```mermaid
erDiagram
    venues ||--o{ libraries : "has"
    venues ||--o{ memberships : "is staffed by"
    venues ||--o{ sessions : "runs"
    users ||--o{ memberships : "works at"
    users ||--o{ favorites : "saves"
    libraries ||--o{ songs : "holds"
    songs ||--o{ favorites : "is saved as"

    venues { uuid id PK; text name; text slug UK }
    users { uuid id PK; text email UK; bool is_platform_admin }
    memberships { uuid user_id FK; uuid venue_id FK; text role }
    libraries { uuid id PK; uuid venue_id FK; bool is_public }
    songs { uuid id PK; uuid library_id FK; text title; text artist }
    sessions { uuid id PK; uuid venue_id FK; timestamptz closed_at }
    favorites { uuid user_id FK; uuid song_id FK }
```

A guest has no row anywhere. A patron with favourites is a `users` row with no
`memberships` row. That absence is the whole definition.

---

## 4. Where song details come from

```mermaid
flowchart TD
    ADD["Someone types<br/>a title and an artist"] --> MISS{"Anything<br/>missing?"}
    MISS -->|no| DONE["Save"]
    MISS -->|yes| IT["iTunes Search<br/>no key needed"]

    IT --> F1["album · year · genre<br/>running time · cover art"]
    F1 --> REST{"Still<br/>blank?"}

    REST -->|yes| MB["MusicBrainz<br/>1 request per second"]
    REST -->|no| DONE
    MB --> DONE
```

**Why iTunes leads.** MusicBrainz indexes every recording that exists. Asked
for "Bohemian Rhapsody" by Queen it returns ten live bootlegs and no studio
track, so taking the first hit gave the album *Live USA* and the year 1991.
iTunes indexes the commercial catalogue and returned 1975 and 5:55. Checked
against five standards, iTunes got the year and running time right on all five.

Anything a person typed is never overwritten.

---

## 5. What is built

| Feature | State |
|---|---|
| Guest song list, search | built |
| Guest sees whether karaoke is on | built |
| Staff sign in and sign out | built |
| Create a venue | built |
| Add and remove songs | built |
| Fill in song details automatically | built |
| Open and close a karaoke session | built |
| One venue cannot touch another | built, tested |
| Edit a song | built |
| Song table: search, sort, pages, bulk delete | built |
| CSV import | built |
| QR code and share link | built |
| Several libraries per venue | **to port** |
| Dark mode | **to port** |
| Favourites for guests | schema ready, no screen |
| Song requests to the DJ | schema sketched, not built |
| Platform tier | built |
| Playback | out of scope, needs karaoke hardware |

---

## 6. Navigation problems

### What went wrong before

The old app ran two navigations at once, and they disagreed.

```mermaid
flowchart TD
    subgraph Old["Old app, on every /admin page"]
        direction LR
        NAV["Top navbar<br/>Manage Songs · Libraries"]
        SIDE["Sidebar<br/>Dashboard · Songs Library<br/>AI Generator · Customers<br/>Appearance · Venue Settings"]
    end

    NAV -->|"Manage Songs"| A["/admin/songs"]
    SIDE -->|"Songs Library"| A
    NAV -->|"Libraries"| B["/admin/libraries"]
    SIDE -->|"Venue Settings"| B

    style A fill:#fee,stroke:#c33
    style B fill:#fee,stroke:#c33
```

Five faults, all confirmed in the code:

1. **Two menus, same destinations.** The navbar rendered on admin pages too, so
   `/admin/songs` was reachable from "Manage Songs" and from "Songs Library".
2. **One page, two names.** `/admin/libraries` was "Libraries" at the top and
   "Venue Settings" in the sidebar. This is the thing you noticed.
3. **Four of six sidebar items were empty.** Dashboard, AI Generator, Customers
   and Appearance all rendered "Coming Soon".
4. **"Home" meant two places.** The navbar logo went to `/`. The sidebar brand
   went to `/admin/songs`.
5. **Guest and staff shared one navbar.** A signed-in visitor browsing the
   guest page still saw staff links.

### The rule from now on

**One surface, one menu.** The guest pages and the staff pages do not share
navigation. A page has exactly one route and exactly one name, used everywhere.
Nothing appears in a menu before the page behind it works.

### Faults found and fixed

Both were in the first build of these screens, and both are corrected.

| Problem | Fix |
|---|---|
| `/` listed every venue, publishing the customer list to anyone. A guest arrives by QR code and never needs it. | `/` is a landing page. No venue is named on it. |
| Owning exactly one venue made `/admin` skip the venue list, leaving "Add a venue" unreachable without typing the URL. | "Add a venue" sits in the staff header, on every staff screen. |

### Still open

- No venue switcher. Running two bars means going back to **Your venues**.
  Worth doing when someone actually runs two.
