import React, { useState } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Checkbox,
  Textarea,
  Alert,
  Spinner,
  Progress,
} from "@heroui/react";
import {
  AddNoteBulk,
  LoadingIcon,
  SuccessIcon,
  DangerIcon,
  ClockCircleLinearIcon,
  VolumeUp,
} from "@heroui/shared-icons";
import GenrePills from "./GenrePills";

const BatchImport = ({ onImportComplete, selectedLibrary }) => {
  const [csvData, setCsvData] = useState("");
  const [autoComplete, setAutoComplete] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState("");
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [progressMessage, setProgressMessage] = useState("");

  // Parse CSV data
  const parseCsvData = (csvText) => {
    const lines = csvText.trim().split("\n");
    if (lines.length === 0) return [];

    const songs = [];

    // Detect if first line is header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("title") ||
      firstLine.includes("artist") ||
      firstLine.includes("song");
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, but handle quoted strings
      const columns = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim().replace(/^"(.*)"$/, "$1"));
          current = "";
        } else {
          current += char;
        }
      }
      columns.push(current.trim().replace(/^"(.*)"$/, "$1"));

      // Map columns to song object
      // Expected formats:
      // 1. title, artist
      // 2. title, artist, genre
      // 3. title, artist, genre, duration
      // 4. title, artist, genre, duration, year
      // 5. title, artist, genre, duration, year, album

      if (columns.length >= 2) {
        const song = {
          title: columns[0] || "",
          artist: columns[1] || "",
          genre: columns[2] || "",
          duration: columns[3] || "",
          year: columns[4] ? parseInt(columns[4]) || null : null,
          album: columns[5] || "",
        };

        if (song.title && song.artist) {
          songs.push(song);
        }
      }
    }

    return songs;
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvData(e.target.result);
    };
    reader.readAsText(file);
  };

  // Handle import
  const handleImport = async () => {
    if (!csvData.trim()) {
      alert("Please provide CSV data or upload a file");
      return;
    }

    const songs = parseCsvData(csvData);
    if (songs.length === 0) {
      alert("No valid songs found in the data. Please check the format.");
      return;
    }

    if (!selectedLibrary) {
      setError("Please select a library");
      return;
    }

    setIsImporting(true);
    setResults(null);
    setError("");
    setImportProgress({ current: 0, total: songs.length });

    if (autoComplete) {
      setProgressMessage(
        `Starting metadata lookup for ${songs.length} songs...`
      );
    } else {
      setProgressMessage(`Processing ${songs.length} songs...`);
    }

    try {
      const startTime = Date.now();

      const response = await axios.post(
        `/api/libraries/${selectedLibrary.id}/songs/batch-import`,
        {
          songs,
          autoComplete,
        }
      );

      const processingTime =
        (response.data.processing_time || Date.now() - startTime) / 1000;
      setResults({
        ...response.data,
        processing_time_seconds: processingTime.toFixed(1),
      });

      if (response.data.success.length > 0) {
        onImportComplete && onImportComplete();
      }

      setProgressMessage(`Completed in ${processingTime.toFixed(1)} seconds`);
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error.response?.data?.error || error.message;
      setProgressMessage(`Error: ${errorMessage}`);
      alert("Failed to import songs: " + errorMessage);
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // Clear data
  const handleClear = () => {
    setCsvData("");
    setResults(null);
  };

  // Sample data for demonstration
  const sampleCsvData = `title,artist,genre
"Shake It Off","Taylor Swift","Pop"
"Uptown Funk","Bruno Mars"
"Someone Like You","Adele","Pop"
"Bohemian Rhapsody","Queen","Rock"
"Hotel California","Eagles"`;

  const loadSampleData = () => {
    setCsvData(sampleCsvData);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
            <AddNoteBulk className="w-5 h-5" fill="currentColor" />
            <span>Batch Import Songs</span>
          </h3>
          <Button
            variant="flat"
            size="sm"
            onPress={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? "Hide Instructions" : "Show Instructions"}
          </Button>
        </CardHeader>

        {showInstructions && (
          <CardBody>
            <h4 className="font-semibold mb-3">How to use Batch Import:</h4>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                <strong>CSV Format:</strong> Each line should contain: Title,
                Artist, Genre (optional), Duration (optional), Year (optional),
                Album (optional)
              </li>
              <li>
                <strong>Minimum Required:</strong> Title and Artist are required
              </li>
              <li>
                <strong>Auto-Complete:</strong> Enable to automatically fetch
                missing metadata (genre, duration, album, year) from external
                music databases
              </li>
              <li>
                <strong>File Upload:</strong> Upload a .csv file or paste CSV
                data in the text area
              </li>
              <li>
                <strong>Example formats:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>"Don't Stop Believin'","Journey"</li>
                  <li>"Sweet Caroline","Neil Diamond","Pop"</li>
                  <li>
                    "Bohemian Rhapsody","Queen","Rock","5:55","1975","A Night at
                    the Opera"
                  </li>
                </ul>
              </li>
            </ul>
            <Button color="default" variant="flat" onPress={loadSampleData}>
              Load Sample Data
            </Button>
          </CardBody>
        )}
      </Card>

      <Card className="mb-6">
        <CardBody>
          <Checkbox isSelected={autoComplete} onValueChange={setAutoComplete}>
            <div className="flex flex-col">
              <span className="font-semibold">
                Auto-complete missing metadata
              </span>
              <span className="text-sm text-default-500">
                Automatically fetch and fill in missing genre, duration, album,
                and year information from external music databases
              </span>
            </div>
          </Checkbox>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <Button
            as="label"
            htmlFor="csv-file-input"
            color="default"
            variant="bordered"
            className="cursor-pointer w-fit"
          >
            Choose CSV File
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </Button>

          <Textarea
            label="Or paste CSV data:"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder={`Paste your CSV data here...\nExample:\ntitle,artist,genre\n"Don't Stop Believin'","Journey","Rock"\n"Sweet Caroline","Neil Diamond","Pop"`}
            minRows={8}
            className="w-full"
          />

          {error && (
            <Alert color="danger" className="mt-4">
              {error}
            </Alert>
          )}

          {isImporting && (
            <Card className="mt-4">
              <CardBody>
                <div className="flex flex-col gap-2">
                  <p>{progressMessage}</p>
                  {autoComplete && (
                    <p className="text-sm text-default-500 flex items-center gap-2">
                      <LoadingIcon className="w-4 h-4" fill="currentColor" />
                      <span>
                        Fetching metadata from external sources - this may take
                        a few moments...
                      </span>
                    </p>
                  )}
                  <Progress
                    aria-label="Import progress"
                    value={
                      importProgress.total > 0
                        ? (importProgress.current / importProgress.total) * 100
                        : undefined
                    }
                    isIndeterminate={importProgress.total === 0}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              onPress={handleImport}
              isDisabled={isImporting || !csvData.trim()}
              color="primary"
              isLoading={isImporting}
            >
              {isImporting
                ? autoComplete
                  ? "Fetching Metadata..."
                  : "Importing..."
                : "Import Songs"}
            </Button>
            <Button
              onPress={handleClear}
              isDisabled={isImporting}
              color="default"
              variant="flat"
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold">Import Results:</h4>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Alert color="success" className="flex items-center gap-2">
              <SuccessIcon className="w-5 h-5" fill="currentColor" />
              <span>Successfully imported: {results.success.length} songs</span>
            </Alert>

            {results.errors.length > 0 && (
              <Alert color="danger" className="flex items-center gap-2">
                <DangerIcon className="w-5 h-5" fill="currentColor" />
                <span>Failed: {results.errors.length} songs</span>
              </Alert>
            )}

            {results.processing_time_seconds && (
              <p className="text-sm text-default-500 flex items-center gap-2">
                <ClockCircleLinearIcon
                  className="w-4 h-4"
                  fill="currentColor"
                />
                <span>Processing time: {results.processing_time_seconds}s</span>
              </p>
            )}

            {autoComplete && results.success.length > 0 && (
              <p className="text-sm text-default-500 flex items-center gap-2">
                <VolumeUp className="w-4 h-4" fill="currentColor" />
                <span>Metadata enhanced via auto-complete</span>
              </p>
            )}

            {results.success.length > 0 && (
              <div>
                <h5 className="font-semibold mb-3">Successfully Added:</h5>
                <div className="flex flex-col gap-2">
                  {results.success.slice(0, 5).map((song, index) => (
                    <Card key={index} className="p-3">
                      <div className="font-semibold">
                        {song.title} by {song.artist}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <GenrePills genres={song.genre} />
                        {song.duration && (
                          <span className="text-xs text-default-500">
                            ⏱️ {song.duration}
                          </span>
                        )}
                        {song.year && (
                          <span className="text-xs text-default-500">
                            📅 {song.year}
                          </span>
                        )}
                        {song.album && (
                          <span className="text-xs text-default-500">
                            💿 {song.album}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                  {results.success.length > 5 && (
                    <p className="text-sm text-default-500 text-center">
                      ... and {results.success.length - 5} more songs
                    </p>
                  )}
                </div>
              </div>
            )}

            {results.errors.length > 0 && (
              <div>
                <h5 className="font-semibold mb-3">Errors:</h5>
                <div className="flex flex-col gap-2">
                  {results.errors.map((error, index) => (
                    <Alert key={index} color="danger" variant="flat">
                      <div>
                        <strong>Row {error.row}:</strong> {error.error}
                        {error.data && (
                          <div className="text-xs mt-1">
                            Data: {error.data.title || "No title"} -{" "}
                            {error.data.artist || "No artist"}
                          </div>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default BatchImport;
