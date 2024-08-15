---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Setup Shell completion"
description: "How to shell completion and leverage scbctl shell completion"
sidebar_position: 4
---

# Setting Up Shell Completion for scbctl

Shell completion is a feature that allows scbctl to automatically complete command names, flags, and arguments as you type them in your terminal. This can significantly improve your productivity and ease of use when working with scbctl.

## Supported Shells

scbctl supports shell completion for the following shells:

- Bash
- Zsh
- Fish
- PowerShell

## General Setup

To view the shell completion setup instructions, use the following command:

```bash
scbctl completion --help
```

This will display usage information and examples for different shells.

## Bash Completion Setup

1. Ensure that bash-completion is installed. If not, you can install it using your package manager:

   ```bash
   # For Ubuntu/Debian
   sudo apt-get install bash-completion

   # For macOS (using Homebrew)
   brew install bash-completion
   ```

2. Add the following line to your `~/.bashrc` file:

   ```bash
   source <(scbctl completion bash)
   ```

3. Reload your shell or run:

   ```bash
   source ~/.bashrc
   ```

## Zsh Completion Setup

1. Add the following line to your `~/.zshrc` file:

   ```zsh
   source <(scbctl completion zsh)
   ```

2. If you get an error like `complete:13: command not found: compdef`, add the following to the beginning of your `~/.zshrc` file:

   ```zsh
   autoload -Uz compinit
   compinit
   ```

3. Reload your shell or run:

   ```zsh
   source ~/.zshrc
   ```

## Fish Completion Setup

1. Run the following command:

   ```fish
   scbctl completion fish | source
   ```

2. To make it permanent, append the above command to your `~/.config/fish/config.fish` file:

   ```fish
   echo "scbctl completion fish | source" >> ~/.config/fish/config.fish
   ```

## PowerShell Completion Setup

1. Create a new file named `scbctl_completion.ps1` in your PowerShell profile directory:

   ```powershell
   scbctl completion powershell > $HOME\Documents\WindowsPowerShell\scbctl_completion.ps1
   ```

2. Add the following line to your PowerShell profile:

   ```powershell
   . $HOME\Documents\WindowsPowerShell\scbctl_completion.ps1
   ```

## Verifying Completion Setup

After setting up completion, you can verify it's working by:

1. Starting a new shell session or reloading your current one.
2. Typing `scbctl` followed by a space and then pressing the Tab key.
3. You should see available commands or options auto-completed or listed.

## Troubleshooting

If completion doesn't work after following these steps:

1. Ensure you've reloaded your shell or started a new session.
2. Check that scbctl is in your system's PATH.
3. Verify that you've correctly added the completion command to your shell's configuration file.
4. For Bash and Zsh, make sure you have the required completion utilities installed.
