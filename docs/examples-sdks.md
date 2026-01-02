# Vantage API Examples & SDKs

## Overview

This document provides practical examples for integrating with the Vantage API in various programming languages and frameworks.

## Authentication

The Vantage API uses server-side API keys for external data sources. Client-side requests may require reCAPTCHA tokens for rate limiting.

## Base Configuration

```javascript
const VANTAGE_API_BASE = 'http://localhost:3001';
const VANTAGE_API_KEY = process.env.VANTAGE_API_KEY; // If available
```

## JavaScript/Node.js

### Basic Profile Fetch

```javascript
async function getPlayerProfile(steamId) {
  const response = await fetch(`${VANTAGE_API_BASE}/api/profile/${steamId}`);
  const data = await response.json();

  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.error);
  }
}

// Usage
try {
  const profile = await getPlayerProfile('76561198012345678');
  console.log('Risk Score:', profile.risk.totalScore);
  console.log('Risk Level:', profile.risk.level);
} catch (error) {
  console.error('Failed to fetch profile:', error.message);
}
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

function useVantageProfile(steamId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!steamId) return;

    setLoading(true);
    fetch(`${VANTAGE_API_BASE}/api/profile/${steamId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [steamId]);

  return { profile, loading, error };
}

// Usage in component
function PlayerCard({ steamId }) {
  const { profile, loading, error } = useVantageProfile(steamId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div className="player-card">
      <h3>{profile.steam.username}</h3>
      <div>Risk: {profile.risk.level} ({profile.risk.totalScore})</div>
      {profile.faceit && <div>Faceit ELO: {profile.faceit.elo}</div>}
    </div>
  );
}
```

### Express.js Middleware

```javascript
const express = require('express');
const app = express();

// Vantage API proxy middleware
app.get('/api/vantage/:steamId', async (req, res) => {
  try {
    const response = await fetch(`${VANTAGE_API_BASE}/api/profile/${req.params.steamId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Vantage API' });
  }
});

app.listen(3000);
```

## Python

### Basic Implementation

```python
import requests
import json

class VantageClient:
    def __init__(self, base_url='http://localhost:3001'):
        self.base_url = base_url

    def get_profile(self, steam_id):
        """Get player profile by Steam ID"""
        url = f"{self.base_url}/api/profile/{steam_id}"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            if data['success']:
                return data['data']
            else:
                raise Exception(data['error'])
        else:
            raise Exception(f"HTTP {response.status_code}: {response.text}")

    def refresh_profile(self, steam_id):
        """Force refresh cached profile"""
        url = f"{self.base_url}/api/profile/{steam_id}/refresh"
        response = requests.post(url)

        if response.status_code == 200:
            data = response.json()
            if data['success']:
                return data['message']
            else:
                raise Exception(data['error'])
        else:
            raise Exception(f"HTTP {response.status_code}: {response.text}")

# Usage
client = VantageClient()

try:
    profile = client.get_profile('76561198012345678')
    print(f"Player: {profile['steam']['username']}")
    print(f"Risk Score: {profile['risk']['totalScore']}")
    print(f"Risk Level: {profile['risk']['level']}")

    if profile.get('faceit'):
        print(f"Faceit ELO: {profile['faceit']['elo']}")

    if profile.get('leetify'):
        print(f"Leetify Rating: {profile['leetify']['rating']['aim']}")

except Exception as e:
    print(f"Error: {e}")
```

### Django Integration

```python
# views.py
from django.http import JsonResponse
import requests

def vantage_profile(request, steam_id):
    try:
        response = requests.get(f'http://localhost:3001/api/profile/{steam_id}')
        data = response.json()

        if data['success']:
            return JsonResponse(data['data'])
        else:
            return JsonResponse({'error': data['error']}, status=400)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('profile/<str:steam_id>/', views.vantage_profile),
]
```

### Flask Integration

```python
from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route('/profile/<steam_id>')
def get_profile(steam_id):
    try:
        response = requests.get(f'http://localhost:3001/api/profile/{steam_id}')
        data = response.json()

        if data['success']:
            return jsonify(data['data'])
        else:
            return jsonify({'error': data['error']}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

## PHP

### Basic Implementation

```php
<?php

class VantageClient {
    private $baseUrl;

    public function __construct($baseUrl = 'http://localhost:3001') {
        $this->baseUrl = $baseUrl;
    }

    public function getProfile($steamId) {
        $url = $this->baseUrl . '/api/profile/' . $steamId;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if ($data['success']) {
                return $data['data'];
            } else {
                throw new Exception($data['error']);
            }
        } else {
            throw new Exception("HTTP $httpCode: $response");
        }
    }
}

// Usage
try {
    $client = new VantageClient();
    $profile = $client->getProfile('76561198012345678');

    echo "Player: " . $profile['steam']['username'] . "\n";
    echo "Risk Score: " . $profile['risk']['totalScore'] . "\n";
    echo "Risk Level: " . $profile['risk']['level'] . "\n";

    if (isset($profile['faceit'])) {
        echo "Faceit ELO: " . $profile['faceit']['elo'] . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

?>
```

### Laravel Integration

```php
// app/Services/VantageService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class VantageService {
    protected $baseUrl;

    public function __construct() {
        $this->baseUrl = config('services.vantage.url', 'http://localhost:3001');
    }

    public function getProfile($steamId) {
        $response = Http::get("{$this->baseUrl}/api/profile/{$steamId}");

        if ($response->successful()) {
            $data = $response->json();

            if ($data['success']) {
                return $data['data'];
            } else {
                throw new \Exception($data['error']);
            }
        } else {
            throw new \Exception("Vantage API request failed: " . $response->status());
        }
    }
}

// app/Http/Controllers/PlayerController.php
<?php

namespace App\Http\Controllers;

use App\Services\VantageService;
use Illuminate\Http\Request;

class PlayerController extends Controller {
    protected $vantage;

    public function __construct(VantageService $vantage) {
        $this->vantage = $vantage;
    }

    public function show($steamId) {
        try {
            $profile = $this->vantage->getProfile($steamId);
            return response()->json($profile);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
```

## Go

### Basic Implementation

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type VantageClient struct {
    BaseURL string
}

type ApiResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Timestamp string    `json:"timestamp"`
}

func NewVantageClient(baseURL string) *VantageClient {
    return &VantageClient{BaseURL: baseURL}
}

func (c *VantageClient) GetProfile(steamID string) (interface{}, error) {
    url := fmt.Sprintf("%s/api/profile/%s", c.BaseURL, steamID)

    resp, err := http.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var apiResp ApiResponse
    if err := json.Unmarshal(body, &apiResp); err != nil {
        return nil, err
    }

    if !apiResp.Success {
        return nil, fmt.Errorf(apiResp.Error)
    }

    return apiResp.Data, nil
}

func main() {
    client := NewVantageClient("http://localhost:3001")

    profile, err := client.GetProfile("76561198012345678")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    // Type assert to access fields
    profileMap, ok := profile.(map[string]interface{})
    if !ok {
        fmt.Println("Invalid profile format")
        return
    }

    steam := profileMap["steam"].(map[string]interface{})
    risk := profileMap["risk"].(map[string]interface{})

    fmt.Printf("Player: %s\n", steam["username"])
    fmt.Printf("Risk Score: %.0f\n", risk["totalScore"])
    fmt.Printf("Risk Level: %s\n", risk["level"])
}
```

## C#

### Basic Implementation

```csharp
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

public class VantageClient {
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public VantageClient(string baseUrl = "http://localhost:3001") {
        _httpClient = new HttpClient();
        _baseUrl = baseUrl;
    }

    public async Task<dynamic> GetProfileAsync(string steamId) {
        var url = $"{_baseUrl}/api/profile/{steamId}";

        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<JsonElement>(json);

        if (!data.GetProperty("success").GetBoolean()) {
            throw new Exception(data.GetProperty("error").GetString());
        }

        return data.GetProperty("data");
    }
}

// Usage
class Program {
    static async Task Main() {
        var client = new VantageClient();

        try {
            dynamic profile = await client.GetProfileAsync("76561198012345678");

            Console.WriteLine($"Player: {profile.GetProperty("steam").GetProperty("username")}");
            Console.WriteLine($"Risk Score: {profile.GetProperty("risk").GetProperty("totalScore")}");
            Console.WriteLine($"Risk Level: {profile.GetProperty("risk").GetProperty("level")}");

            if (profile.TryGetProperty("faceit", out var faceit)) {
                Console.WriteLine($"Faceit ELO: {faceit.GetProperty("elo")}");
            }

        } catch (Exception ex) {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}
```

## Ruby

### Basic Implementation

```ruby
require 'net/http'
require 'json'

class VantageClient
  def initialize(base_url = 'http://localhost:3001')
    @base_url = base_url
  end

  def get_profile(steam_id)
    url = URI("#{@base_url}/api/profile/#{steam_id}")

    response = Net::HTTP.get_response(url)

    if response.code == '200'
      data = JSON.parse(response.body)

      if data['success']
        return data['data']
      else
        raise data['error']
      end
    else
      raise "HTTP #{response.code}: #{response.body}"
    end
  end
end

# Usage
client = VantageClient.new

begin
  profile = client.get_profile('76561198012345678')

  puts "Player: #{profile['steam']['username']}"
  puts "Risk Score: #{profile['risk']['totalScore']}"
  puts "Risk Level: #{profile['risk']['level']}"

  if profile['faceit']
    puts "Faceit ELO: #{profile['faceit']['elo']}"
  end

rescue => e
  puts "Error: #{e.message}"
end
```

## Error Handling

All examples include proper error handling for:

- Network failures
- Invalid Steam IDs
- API rate limiting
- Server errors
- Malformed responses

## Rate Limiting Considerations

When implementing clients, consider:

- **Caching**: Cache results to avoid repeated API calls
- **Backoff**: Implement exponential backoff for retries
- **User-Agent**: Set descriptive User-Agent headers
- **Timeouts**: Configure reasonable request timeouts

## Production Deployment

For production use:

1. **Environment Variables**: Store API base URLs in environment
2. **Connection Pooling**: Reuse HTTP connections
3. **Monitoring**: Log API usage and errors
4. **Fallbacks**: Handle API downtime gracefully
5. **Security**: Validate and sanitize inputs

## Testing

```bash
# Test with curl
curl "http://localhost:3001/api/profile/76561198012345678"

# Test error handling
curl "http://localhost:3001/api/profile/invalid"

# Test rate limiting
for i in {1..10}; do
  curl -s "http://localhost:3001/api/profile/76561198012345678" &
done
```</content>
<parameter name="filePath">c:\Users\drwn\Downloads\vantage-main\docs\examples-sdks.md