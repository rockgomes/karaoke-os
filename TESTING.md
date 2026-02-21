# 🧪 Testing Guide - Karaoke Zen SaaS with Libraries

## ✅ Setup Complete!

The application has been successfully restarted with:
- ✅ Fresh database with new schema (libraries support)
- ✅ Test user account created
- ✅ Default library automatically created

## 🚀 Access the Application

**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:5001

## 🔐 Test Credentials

- **Email:** `test@karaoke-zen.com`
- **Username:** `testuser`
- **Password:** `test123`

## 📚 Default Library

- **Name:** My Library
- **Slug:** `my-library`
- **Public URL:** http://localhost:3000/library/my-library

## 🧪 Test Scenarios

### 1. Basic Login & Library Selection

1. Go to http://localhost:3000
2. Click "Login"
3. Login with:
   - Email: `test@karaoke-zen.com` OR Username: `testuser`
   - Password: `test123`
4. You should see the library selector showing "My Library"
5. The share URL should be displayed below

### 2. Create a New Library

1. In the library selector, click "+ New Library"
2. Enter a name (e.g., "Christmas Songs")
3. Click "Create"
4. The new library should be selected
5. A new share URL will be generated

### 3. Add Songs to a Library

1. Click "Manage" in the navbar
2. Select a library from the dropdown
3. Fill in the form to add a song:
   - Title: "Jingle Bells"
   - Artist: "Various Artists"
   - Genre: "Holiday"
   - (Optional: Duration, Year, Album)
4. Click "Add Song"
5. The song should appear in the list

### 4. View Songs in a Library

1. Click "My Songs" in the navbar
2. Select a library from the dropdown
3. You should see all songs in that library
4. Try filtering by genre or artist
5. Click on a song to see details

### 5. Batch Import Songs

1. Go to "Manage" page
2. Select a library
3. Click on "Batch Import" tab
4. Paste CSV data or use the sample format
5. Enable "Auto-complete metadata" if you want Last.fm enrichment
6. Click "Import Songs"
7. Watch the progress and results

### 6. Share a Library (Public View)

1. On the "My Songs" page, select a library
2. Copy the share URL shown below the library selector
3. Open the URL in an incognito/private window
4. You should see the public view of the library
5. You can browse, search, and filter songs without logging in
6. Note: You cannot edit songs from the public view

### 7. Manage Libraries

1. Click "Libraries" in the navbar
2. You should see all your libraries listed
3. Try editing a library name
4. Try deleting a library (be careful - this deletes all songs!)

### 8. Test Multi-Library Isolation

1. Create a second library (e.g., "Summer Hits")
2. Add songs to this new library
3. Switch back to "My Library"
4. Verify songs from one library don't appear in the other
5. Switch libraries - each should show only its own songs

### 9. Test Public Library URLs

1. Create two libraries with different songs
2. Get the share URL for each
3. Open both URLs in different tabs
4. Verify each shows only its own songs
5. Verify the library name is displayed correctly

## 🔍 API Testing (Optional)

You can test the API directly using curl:

### Get Libraries
```bash
curl -X GET http://localhost:5001/api/libraries \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Songs in a Library
```bash
curl -X GET http://localhost:5001/api/libraries/1/songs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Public Library
```bash
curl -X GET http://localhost:5001/api/public/libraries/my-library
```

### Get Public Library Songs
```bash
curl -X GET http://localhost:5001/api/public/libraries/my-library/songs
```

## ✅ Expected Behaviors

- ✅ Each user has isolated libraries
- ✅ Songs are scoped to libraries
- ✅ Libraries can be shared via unique URLs
- ✅ Public views don't require authentication
- ✅ Library selector works across all pages
- ✅ Default library created on signup
- ✅ Batch import works per library
- ✅ All CRUD operations respect library boundaries

## 🐛 Troubleshooting

**Problem:** Can't see libraries after login  
**Solution:** Check browser console for errors. Make sure backend is running on port 5001.

**Problem:** Public library URL returns 404  
**Solution:** Verify the slug matches exactly. Check that the library exists in the database.

**Problem:** Songs not appearing  
**Solution:** Make sure you've selected a library. Check that songs belong to the selected library.

**Problem:** Can't create library  
**Solution:** Check that you're logged in and have a valid token. Check browser console for errors.

## 🎉 Success Criteria

- [x] Can login with test account
- [x] Default library is created automatically
- [x] Can create additional libraries
- [x] Can add songs to libraries
- [x] Can view songs in libraries
- [x] Can share library via public URL
- [x] Public view works without authentication
- [x] Libraries are isolated from each other
- [x] Library selector works consistently

---

**Happy Testing! 🎤🎵**



