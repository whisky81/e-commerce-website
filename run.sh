#!/usr/bin/bash 
tmux new-session -d -s eComWeb 'cd backend && npm run v2'
tmux split-window -h 'cd frontend && npm run dev'
tmux split-window -v 'cd admin && npm run dev'
tmux attach -t eComWeb