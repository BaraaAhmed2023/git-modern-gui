#!/usr/bin/env python3
import os
import sys
import time
import json
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess

class GitFileChangeHandler(FileSystemEventHandler):
    def __init__(self, repo_path):
        self.repo_path = Path(repo_path)
        self.last_events = {}

    def on_any_event(self, event):
        try:
            # Skip .git directory
            if '.git' in str(event.src_path):
                return

            # Skip if this is a directory event
            if event.is_directory:
                return

            # Get relative path from repo
            try:
                rel_path = str(Path(event.src_path).relative_to(self.repo_path)) # type: ignore
            except ValueError:
                return  # File not in repository

            # Check git status
            git_status = self.get_git_status(rel_path)

            # Only report if status changed
            current_status = f"{event.event_type}:{git_status}"
            last_status = self.last_events.get(rel_path)

            if current_status != last_status:
                self.last_events[rel_path] = current_status

                # Output change as JSON
                change_info = {
                    'path': rel_path,
                    'event': event.event_type,
                    'git_status': git_status,
                    'timestamp': time.time(),
                    'is_directory': False
                }

                print(json.dumps(change_info))
                sys.stdout.flush()

        except Exception as e:
            # Don't crash on errors, just log
            error_info = {
                'error': str(e),
                'path': event.src_path if hasattr(event, 'src_path') else 'unknown'
            }
            print(json.dumps(error_info))
            sys.stdout.flush()

    def get_git_status(self, file_path):
        """Check git status of a file."""
        try:
            result = subprocess.run(
                ['git', '-C', str(self.repo_path), 'status', '--porcelain', file_path],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0 and result.stdout.strip():
                status = result.stdout.strip()[0:2]
                return status.strip()

        except Exception:
            pass

        return '??'  # Untracked by default

def watch_repository(repo_path):
    """Watch a repository for file changes."""
    if not os.path.exists(repo_path):
        print(json.dumps({'error': f'Repository not found: {repo_path}'}))
        sys.exit(1)

    if not os.path.exists(os.path.join(repo_path, '.git')):
        print(json.dumps({'error': f'Not a git repository: {repo_path}'}))
        sys.exit(1)

    # Initial scan of modified files
    try:
        result = subprocess.run(
            ['git', '-C', repo_path, 'status', '--porcelain'],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    status = line[0:2].strip()
                    file_path = line[3:].strip()

                    initial_info = {
                        'path': file_path,
                        'event': 'initial',
                        'git_status': status,
                        'timestamp': time.time(),
                        'is_directory': False
                    }

                    print(json.dumps(initial_info))
                    sys.stdout.flush()

    except Exception as e:
        print(json.dumps({'error': f'Initial scan failed: {str(e)}'}))
        sys.stdout.flush()

    # Set up file watcher
    event_handler = GitFileChangeHandler(repo_path)
    observer = Observer()

    # Watch all subdirectories
    observer.schedule(event_handler, repo_path, recursive=True)

    try:
        observer.start()
        print(json.dumps({'status': 'watching', 'path': repo_path}))
        sys.stdout.flush()

        # Keep running
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        observer.stop()
    except Exception as e:
        print(json.dumps({'error': f'Watcher crashed: {str(e)}'}))
        sys.stdout.flush()
        observer.stop()
        sys.exit(1)

    observer.join()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing repository path argument'}))
        sys.exit(1)

    repo_path = sys.argv[1]
    watch_repository(repo_path)

if __name__ == '__main__':
    main()