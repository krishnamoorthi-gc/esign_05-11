#!/bin/sh

echo "Test script running successfully"
echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"
echo "Environment variables:"
env
exit 0