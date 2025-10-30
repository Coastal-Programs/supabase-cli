# Storage Authentication Limitation

## Overview

The storage commands in this CLI use the **Supabase Management API** for bucket metadata operations (list, create, delete), not the **Storage API** for file operations. This is an important distinction that affects what operations are supported.

## The Two APIs

### Management API (Used by this CLI)

**Endpoint**: `https://api.supabase.com/v1`
**Authentication**: Personal Access Token (PAT)
**Source**: https://supabase.com/dashboard/account/tokens

**Capabilities**:
- List storage buckets
- Get bucket details
- Create new buckets
- Delete buckets
- Basic bucket configuration

**Limitations**:
- Cannot upload/download files
- Cannot list files in buckets
- Limited RLS policy management
- No real-time file operations

### Storage API (Not Used by this CLI)

**Endpoint**: `https://{project-ref}.supabase.co/storage/v1`
**Authentication**: Service Role Key
**Source**: Project Settings > API Keys > Service Role

**Capabilities**:
- Upload files
- Download files
- List files in buckets
- Delete files
- Advanced RLS policies
- Real-time operations

## Why the Difference?

Supabase has intentionally separated these APIs:

1. **Management API**: Designed for administrative operations across multiple projects
   - Uses Personal Access Token for broader access
   - Operates at the organization/account level
   - Limited to metadata operations

2. **Storage API**: Designed for application-level operations within a project
   - Uses Service Role Key for project-specific access
   - Operates at the project level
   - Full file operations support

## What Works vs. What Doesn't

### What This CLI CAN Do

```bash
# List all buckets in a project
supabase-cli storage:buckets:list my-project

# Get details about a specific bucket
supabase-cli storage:buckets:get my-project my-bucket

# Create a new bucket
supabase-cli storage:buckets:create my-project uploads --public

# Delete a bucket
supabase-cli storage:buckets:delete my-project old-bucket --yes

# List bucket policies
supabase-cli storage:policies:list my-project my-bucket

# Set bucket policies
supabase-cli storage:policies:set my-project my-bucket \
  --policy '{"name":"Public Read","action":"SELECT","definition":"true"}'
```

### What This CLI CANNOT Do

```bash
# Upload a file - NOT SUPPORTED
supabase-cli storage:files:upload my-project my-bucket path/to/file.txt

# Download a file - NOT SUPPORTED
supabase-cli storage:files:download my-project my-bucket file.txt

# List files in a bucket - NOT SUPPORTED
supabase-cli storage:files:list my-project my-bucket

# Delete a specific file - NOT SUPPORTED
supabase-cli storage:files:delete my-project my-bucket file.txt
```

## How to Perform File Operations

For file operations, use the **Supabase SDK** directly:

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'

// Initialize with Service Role Key (NOT PAT token)
const supabase = createClient(
  'https://your-project-ref.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // From Project Settings > API Keys
)

// Upload a file
const { data, error } = await supabase.storage
  .from('my-bucket')
  .upload('path/to/file.txt', file)

// Download a file
const { data, error } = await supabase.storage
  .from('my-bucket')
  .download('path/to/file.txt')

// List files in a bucket
const { data, error } = await supabase.storage
  .from('my-bucket')
  .list('path/')

// Delete a file
const { data, error } = await supabase.storage
  .from('my-bucket')
  .remove(['path/to/file.txt'])
```

### Python

```python
from supabase import create_client, Client

# Initialize with Service Role Key (NOT PAT token)
url = 'https://your-project-ref.supabase.co'
key = 'YOUR_SERVICE_ROLE_KEY'  # From Project Settings > API Keys
supabase: Client = create_client(url, key)

# Upload a file
with open('path/to/file.txt', 'rb') as f:
    response = supabase.storage.from_('my-bucket').upload('file.txt', f)

# Download a file
response = supabase.storage.from_('my-bucket').download('file.txt')

# List files
response = supabase.storage.from_('my-bucket').list('path/')

# Delete a file
response = supabase.storage.from_('my-bucket').remove(['file.txt'])
```

## Getting Your Service Role Key

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy the **Service Role** key (starts with `eyJ...`)

**Important**: Keep this key secret! It has full access to your project.

## Common Use Cases

### Case 1: Bucket Management + File Operations

```bash
# Use this CLI for bucket operations
supabase-cli storage:buckets:create my-project user-uploads --public

# Use SDK for file operations
const supabase = createClient(projectUrl, serviceRoleKey)
await supabase.storage.from('user-uploads').upload('file.txt', file)
```

### Case 2: CI/CD Pipeline

```bash
# Use CLI to validate bucket exists
supabase-cli storage:buckets:get $PROJECT_REF uploads

# Use SDK in your deployment script
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY)
await supabase.storage.from('uploads').upload(filename, fileContent)
```

### Case 3: Batch Operations

For batch operations (uploading multiple files, managing policies), you'll need to:

1. **Validate buckets exist**: Use this CLI
2. **Perform operations**: Use the SDK in a custom script

```bash
#!/bin/bash
# Check bucket exists
supabase-cli storage:buckets:get $PROJECT my-bucket
if [ $? -eq 0 ]; then
  # Run Node.js script for batch upload
  node upload-batch.js
fi
```

## API Response Limitations

The Management API returns limited information about buckets compared to what the Storage API provides:

**Management API Response**:
```json
{
  "id": "bucket-id",
  "name": "my-bucket",
  "owner": "project-owner",
  "public": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Storage API Response**:
```json
{
  "id": "bucket-id",
  "name": "my-bucket",
  "owner": "project-owner",
  "public": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "file_size_limit": 52428800,
  "allowed_mime_types": ["image/jpeg", "image/png"],
  "file_count": 42,
  "used_bytes": 1024000000
}
```

The Storage API provides file count, usage statistics, and MIME type restrictions not available through the Management API.

## Future Enhancements

Possible future improvements to this CLI:

1. **Service Role Key Support**: Add optional support for Storage API operations
2. **File Operations**: Implement file upload/download/list commands
3. **Batch Operations**: Support batch file uploads with progress tracking
4. **Policy Editor**: Interactive policy creation wizard

To request these features, please open an issue on GitHub.

## Troubleshooting

### "Storage API not available"

This CLI only supports Management API operations. For Storage API operations, use the Supabase SDK.

### "Authentication failed for bucket operations"

Make sure your `SUPABASE_ACCESS_TOKEN` is set and valid:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
supabase-cli storage:buckets:list my-project
```

### "Cannot upload files"

This CLI does not support file uploads. Use the SDK:

```typescript
const supabase = createClient(url, serviceRoleKey)
await supabase.storage.from('bucket').upload('file.txt', file)
```

## Related Documentation

- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [Supabase Management API](https://supabase.com/docs/reference/api/introduction)
- [Supabase SDK Quickstart](https://supabase.com/docs/guides/getting-started)
- [Storage Security & RLS](https://supabase.com/docs/guides/storage/security)

## Summary

This CLI provides **bucket management** (list, create, delete) through the Management API.
For **file operations** (upload, download, list, delete), use the **Supabase SDK** with your Service Role Key.

Both tools work together as part of a complete Supabase workflow.
