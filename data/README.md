# Data Directory

This directory is used to store shared round data as JSON files in production.

The structure is:

- `rounds/` - Contains individual round files as `<uuid>.json`

Each round file contains the complete round data including:

- Round metadata (id, completedAt, totalTime, teamName, description)
- Lap data (lapNumber, time, timestamp)

## Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "completedAt": "2024-01-01T12:00:00Z",
  "totalTime": 90000,
  "teamName": "Example Team",
  "description": "Example round description",
  "laps": [
    {
      "lapNumber": 1,
      "time": 5000,
      "timestamp": "2024-01-01T12:00:05Z"
    },
    {
      "lapNumber": 2,
      "time": 10000,
      "timestamp": "2024-01-01T12:00:10Z"
    }
  ]
}
```
