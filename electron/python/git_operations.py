#!/usr/bin/env python3
import subprocess
import json
import sys
import os
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional
import datetime

class GitOperations:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()

    def run_git_command(self, args: List[str], capture_output: bool = True) -> Dict[str, Any]:
        """Run a git command and return the result."""
        try:
            full_args = ['git', '-C', str(self.repo_path)] + args

            if capture_output:
                result = subprocess.run(
                    full_args,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    timeout=30
                )

                output = {
                    'success': result.returncode == 0,
                    'output': result.stdout.strip(),
                    'error': result.stderr.strip(),
                    'returncode': result.returncode
                }
            else:
                # For commands that need real-time output
                result = subprocess.run(
                    full_args,
                    timeout=30
                )
                output = {
                    'success': result.returncode == 0,
                    'output': '',
                    'error': '',
                    'returncode': result.returncode
                }

            return output

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'output': '',
                'error': 'Command timed out after 30 seconds',
                'returncode': 1
            }
        except Exception as e:
            return {
                'success': False,
                'output': '',
                'error': str(e),
                'returncode': 1
            }

    def get_status(self) -> Dict[str, Any]:
        """Get detailed repository status."""
        try:
            # Get staged changes (--cached)
            staged_result = self.run_git_command(['diff', '--name-status', '--cached'])
            staged = self._parse_diff_status(staged_result['output']) if staged_result['success'] else []

            # Get unstaged changes
            unstaged_result = self.run_git_command(['diff', '--name-status'])
            unstaged = self._parse_diff_status(unstaged_result['output']) if unstaged_result['success'] else []

            # Get untracked files
            untracked_result = self.run_git_command(['ls-files', '--others', '--exclude-standard'])
            untracked = []
            if untracked_result['success']:
                untracked = [
                    {'status': '??', 'file': file.strip()}
                    for file in untracked_result['output'].split('\n')
                    if file.strip()
                ]

            # Get current branch
            branch_result = self.run_git_command(['branch', '--show-current'])
            branch = branch_result['output'].strip() if branch_result['success'] else None

            # Get remote info
            remote_result = self.run_git_command(['remote', '-v'])
            remote = remote_result['output'].strip() if remote_result['success'] else None

            return {
                'success': True,
                'status': {
                    'staged': staged,
                    'unstaged': unstaged,
                    'untracked': untracked,
                    'branch': branch,
                    'remote': remote,
                    'has_changes': bool(staged or unstaged or untracked)
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'status': None
            }

    def _parse_diff_status(self, output: str) -> List[Dict[str, str]]:
        """Parse git diff --name-status output."""
        files = []
        for line in output.strip().split('\n'):
            if line.strip():
                parts = line.split('\t')
                if len(parts) >= 2:
                    files.append({
                        'status': parts[0].strip(),
                        'file': parts[1].strip()
                    })
        return files

    def stage_file(self, file_path: str) -> Dict[str, Any]:
        """Stage a specific file."""
        try:
            result = self.run_git_command(['add', file_path])
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def stage_all(self) -> Dict[str, Any]:
        """Stage all changes."""
        try:
            result = self.run_git_command(['add', '.'])
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def unstage_file(self, file_path: str) -> Dict[str, Any]:
        """Unstage a specific file."""
        try:
            result = self.run_git_command(['reset', 'HEAD', '--', file_path])
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def unstage_all(self) -> Dict[str, Any]:
        """Unstage all files."""
        try:
            result = self.run_git_command(['reset', 'HEAD', '--', '.'])
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def add_untracked_file(self, file_path: str) -> Dict[str, Any]:
        """Add an untracked file."""
        try:
            result = self.run_git_command(['add', file_path])
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def add_all_untracked(self) -> Dict[str, Any]:
        """Add all untracked files."""
        try:
            # Get all untracked files
            result = self.run_git_command(['ls-files', '--others', '--exclude-standard'])
            if not result['success'] or not result['output']:
                return {'success': True, 'output': 'No untracked files to add'}

            untracked_files = result['output'].strip().split('\n')
            for file in untracked_files:
                if file.strip():
                    self.run_git_command(['add', file.strip()])

            return {'success': True, 'output': f'Added {len(untracked_files)} untracked files'}
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def init_repository(self) -> Dict[str, Any]:
        """Initialize a new git repository."""
        try:
            # Create directory if it doesn't exist
            self.repo_path.mkdir(parents=True, exist_ok=True)

            # Initialize git
            init_result = self.run_git_command(['init'])

            if init_result['success']:
                # Create .gitignore with common patterns
                gitignore_content = """# Dependencies
node_modules/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs
coverage/

# nyc test coverage
.nyc_output

# Build output
dist/
build/
out/

# Misc
.DS_Store
*.pem
"""

                gitignore_path = self.repo_path / '.gitignore'
                gitignore_path.write_text(gitignore_content)

                # Create initial README
                readme_path = self.repo_path / 'README.md'
                readme_path.write_text(f'# {self.repo_path.name}\n\nInitialized with Modern Git GUI\n')

                # Add and commit initial files
                self.run_git_command(['add', '.'])
                commit_result = self.run_git_command(['commit', '-m', 'Initial commit'])

                return {
                    'success': True,
                    'output': f'Repository initialized at {self.repo_path}',
                    'commit_hash': self._get_head_hash() if commit_result['success'] else None
                }
            else:
                return init_result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _get_head_hash(self) -> Optional[str]:
        """Get the current HEAD commit hash."""
        result = self.run_git_command(['rev-parse', 'HEAD'])
        return result['output'].strip() if result['success'] else None

    def commit(self, message: str, files: List[str] = None) -> Dict[str, Any]:
        """Commit changes to the repository."""
        try:
            # Stage files
            if files:
                for file in files:
                    self.run_git_command(['add', file])
            else:
                self.run_git_command(['add', '.'])

            # Commit with message
            commit_result = self.run_git_command(['commit', '-m', message])

            if commit_result['success']:
                return {
                    'success': True,
                    'output': 'Changes committed successfully',
                    'commit_hash': self._get_head_hash()
                }
            else:
                return commit_result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_log(self, limit: int = 50) -> Dict[str, Any]:
        """Get commit history with graph."""
        try:
            # Get log with custom format
            format_str = '--pretty=format:{"hash":"%H","short_hash":"%h","author":"%an","email":"%ae","date":"%ad","subject":"%s","body":"%b"}'

            result = self.run_git_command(['log', '--graph', format_str, f'--max-count={limit}'])

            if result['success']:
                # Parse the output
                commits = []
                graph_lines = []

                lines = result['output'].split('\n')
                graph_line = ''

                for line in lines:
                    if line.strip():
                        if line.startswith('*') or line.startswith('|') or line.startswith('/') or line.startswith('\\'):
                            graph_line = line
                        else:
                            try:
                                commit_data = json.loads(line)
                                commit_data['graph'] = graph_line
                                commits.append(commit_data)
                                graph_line = ''
                            except json.JSONDecodeError:
                                continue

                return {
                    'success': True,
                    'commits': commits,
                    'total': len(commits)
                }
            else:
                return result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_diff(self, file_path: str = None, staged: bool = False) -> Dict[str, Any]:
        """Get diff for a file or all changes."""
        try:
            args = ['diff']
            if staged:
                args.append('--cached')

            if file_path:
                args.append(file_path)

            result = self.run_git_command(args)

            if result['success']:
                return {
                    'success': True,
                    'diff': result['output'],
                    'file': file_path,
                    'staged': staged
                }
            else:
                return result

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def push(self, remote: str = 'origin', branch: str = 'main') -> Dict[str, Any]:
        """Push changes to remote repository."""
        try:
            # First, get current branch if not specified
            if branch == 'main':
                branch_result = self.run_git_command(['branch', '--show-current'])
                if branch_result['success'] and branch_result['output'].strip():
                    branch = branch_result['output'].strip()

            result = self.run_git_command(['push', remote, branch], capture_output=False)

            if result['success']:
                return {
                    'success': True,
                    'output': f'Pushed to {remote}/{branch}'
                }
            else:
                return {
                    'success': False,
                    'error': f'Push failed: {result.get("error", "Unknown error")}'
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def pull(self, remote: str = 'origin', branch: str = 'main') -> Dict[str, Any]:
        """Pull changes from remote repository."""
        try:
            # First, get current branch if not specified
            if branch == 'main':
                branch_result = self.run_git_command(['branch', '--show-current'])
                if branch_result['success'] and branch_result['output'].strip():
                    branch = branch_result['output'].strip()

            result = self.run_git_command(['pull', remote, branch], capture_output=False)

            if result['success']:
                return {
                    'success': True,
                    'output': f'Pulled from {remote}/{branch}'
                }
            else:
                return {
                    'success': False,
                    'error': f'Pull failed: {result.get("error", "Unknown error")}'
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_file_tree(self) -> Dict[str, Any]:
        """Get file tree structure of the repository."""
        try:
            # Get list of all files (excluding .git)
            all_files = []
            for root, dirs, files in os.walk(self.repo_path):
                # Skip .git directory
                if '.git' in root:
                    continue

                for file in files:
                    rel_path = os.path.relpath(os.path.join(root, file), self.repo_path)
                    all_files.append(rel_path)

            # Get git status for each file
            status_result = self.run_git_command(['status', '--porcelain'])
            status_map = {}

            if status_result['success']:
                for line in status_result['output'].strip().split('\n'):
                    if line.strip():
                        status = line[0:2].strip()
                        file_path = line[3:].strip()
                        status_map[file_path] = status

            # Build tree structure
            tree = self._build_tree_structure(all_files, status_map)

            return {
                'success': True,
                'tree': tree,
                'total_files': len(all_files)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _build_tree_structure(self, files: List[str], status_map: Dict[str, str]) -> Dict[str, Any]:
        """Build hierarchical tree structure from file list."""
        root = {
            'name': self.repo_path.name,
            'type': 'folder',
            'path': '.',
            'status': '',
            'children': []
        }

        for file_path in files:
            parts = file_path.split('/')
            current = root['children']

            for i, part in enumerate(parts):
                is_file = i == len(parts) - 1
                existing = None

                for item in current:
                    if item['name'] == part:
                        existing = item
                        break

                if not existing:
                    new_item = {
                        'name': part,
                        'type': 'file' if is_file else 'folder',
                        'path': '/'.join(parts[:i+1]),
                        'status': status_map.get(file_path, ''),
                        'children': [] if not is_file else None
                    }
                    current.append(new_item)
                    existing = new_item

                if not is_file:
                    current = existing['children']

        return root

def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: git_operations.py <command> <repo_path> [args...]'
        }))
        sys.exit(1)

    command = sys.argv[1]
    repo_path = sys.argv[2]
    args = sys.argv[3:] if len(sys.argv) > 3 else []

    git_ops = GitOperations(repo_path)

    try:
        if command == 'status':
            result = git_ops.get_status()
        elif command == 'init':
            result = git_ops.init_repository()
        elif command == 'commit':
            if len(args) < 1:
                result = {'success': False, 'error': 'Missing commit message'}
            else:
                message = args[0]
                files = args[1:] if len(args) > 1 else None
                result = git_ops.commit(message, files)
        elif command == 'log':
            limit = int(args[0]) if args else 50
            result = git_ops.get_log(limit)
        elif command == 'diff':
            file_path = args[0] if args else None
            staged = len(args) > 1 and args[1] == '--staged'
            result = git_ops.get_diff(file_path, staged)
        elif command == 'push':
            remote = args[0] if len(args) > 0 else 'origin'
            branch = args[1] if len(args) > 1 else 'main'
            result = git_ops.push(remote, branch)
        elif command == 'pull':
            remote = args[0] if len(args) > 0 else 'origin'
            branch = args[1] if len(args) > 1 else 'main'
            result = git_ops.pull(remote, branch)
        elif command == 'file-tree':
            result = git_ops.get_file_tree()
        elif command == 'stage':
            file_path = args[0] if args else None
            if not file_path:
                result = {'success': False, 'error': 'Missing file path'}
            else:
                result = git_ops.stage_file(file_path)
        elif command == 'stage-all':
            result = git_ops.stage_all()
        elif command == 'unstage':
            file_path = args[0] if args else None
            if not file_path:
                result = {'success': False, 'error': 'Missing file path'}
            else:
                result = git_ops.unstage_file(file_path)
        elif command == 'unstage-all':
            result = git_ops.unstage_all()
        elif command == 'add-untracked':
            file_path = args[0] if args else None
            if not file_path:
                result = {'success': False, 'error': 'Missing file path'}
            else:
                result = git_ops.add_untracked_file(file_path)
        elif command == 'add-all-untracked':
            result = git_ops.add_all_untracked()
        else:
            result = {
                'success': False,
                'error': f'Unknown command: {command}'
            }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()