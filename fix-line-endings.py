# Fix line endings in entrypoint.sh file
import os

# Path to the entrypoint.sh file
entrypoint_path = r"C:\Users\GC-IT\Documents\Backups\backup 1010\frontend\OpenSign\entrypoint.sh"

# Read the file content
with open(entrypoint_path, 'rb') as f:
    content = f.read()

# Replace Windows line endings with Unix line endings
content = content.replace(b'\r\n', b'\n')

# Write the file back with Unix line endings
with open(entrypoint_path, 'wb') as f:
    f.write(content)

print("Line endings fixed in entrypoint.sh")