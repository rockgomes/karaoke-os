# 🎵 Metadata Service Update: MusicBrainz + Last.fm

## Summary

The metadata service has been upgraded to use **MusicBrainz** as the primary source with **Last.fm** as a fallback. Genre is now **optional**, allowing users to add songs and fill in genre later.

## Changes Made

### Backend Changes

1. **New MusicBrainz Service Class** (`MusicBrainzService`)
   - Fetches metadata from MusicBrainz API (free, no API key required)
   - Handles rate limiting (1 request/second as per MusicBrainz guidelines)
   - Extracts genres, duration (in milliseconds), album, year
   - Format: Converts milliseconds to MM:SS format

2. **Updated MusicMetadataService**
   - Now uses MusicBrainz as **primary** source
   - Falls back to Last.fm if MusicBrainz doesn't have the track
   - Handles duration differences:
     - MusicBrainz: Returns milliseconds → converted to MM:SS
     - Last.fm: Returns milliseconds → divided by 1000 → converted to MM:SS

3. **Genre Made Optional**
   - Database schema updated: `genre TEXT` (removed NOT NULL constraint)
   - Validation updated: Genre is no longer required
   - Songs can be added without genre and edited later
   - Batch import allows songs without genre

4. **API Flow**
   ```
   1. Try MusicBrainz first
   2. If missing data, try Last.fm as fallback
   3. Fill in any remaining gaps
   4. Allow genre to remain null if not found
   ```

### Frontend Changes

1. **AdminPanel Updates**
   - Removed `required` attribute from genre field
   - Added "(optional)" label to genre field
   - Updated validation to not require genre
   - Handles null/empty genre in edit form

2. **User Experience**
   - Users can add songs without genre
   - Genre field clearly marked as optional
   - Songs can be edited later to add genre

## Duration Handling

### MusicBrainz
- **Format**: Returns duration in **milliseconds**
- **Conversion**: `formatDuration()` divides by 1000, converts to MM:SS
- **Example**: 180000ms → "3:00"

### Last.fm
- **Format**: Returns duration in **milliseconds**
- **Conversion**: Code divides by 1000 to get seconds, then `formatDuration()` converts to MM:SS
- **Example**: 180000ms → 180s → "3:00"

Both APIs now consistently return MM:SS format for storage.

## Database Migration

**Note**: For existing databases, SQLite doesn't support ALTER TABLE to change NOT NULL constraints. 

**Options**:
1. **New installations**: Will automatically have the correct schema
2. **Existing databases**: 
   - Option A: Recreate database (delete `karaoke.db` and restart server)
   - Option B: Run migration script (to be created if needed)

The new schema allows NULL genre:
```sql
genre TEXT,  -- No longer NOT NULL
```

## API Endpoints (No Changes)

All existing endpoints work the same way:
- `POST /api/libraries/:libraryId/songs` - Now accepts songs without genre
- `PUT /api/libraries/:libraryId/songs/:id` - Can update genre or set it to null
- `POST /api/libraries/:libraryId/songs/batch-import` - Can import songs without genre

## Testing

1. **Add song without genre**:
   ```json
   {
     "title": "Test Song",
     "artist": "Test Artist"
     // genre omitted
   }
   ```

2. **Add song with metadata enrichment**:
   - Enable auto-complete in batch import
   - MusicBrainz will be queried first
   - Last.fm will be used as fallback if needed

3. **Edit song to add genre later**:
   - Songs without genre can be edited
   - Genre field is optional in the form

## Rate Limiting

- **MusicBrainz**: 1 request per second (automatically handled)
- **Last.fm**: No strict limit, but requests are cached

## Benefits

✅ **More reliable**: MusicBrainz is less buggy than Last.fm  
✅ **No API key needed**: MusicBrainz works without registration  
✅ **Better coverage**: Two sources provide better metadata  
✅ **Flexible**: Genre can be added later if not found  
✅ **Consistent duration**: Both APIs properly handled  

## Future Enhancements

- Add more metadata sources (Discogs, Spotify, etc.)
- Better genre detection algorithms
- User-editable genre suggestions
- Genre autocomplete from existing songs

---

**Implementation Date**: December 2024  
**Status**: ✅ Complete and tested


