# Execute a Specific Task

## Usage

This command requires two parameters:

1. **Directory**: The subfolder containing the project specifications (e.g.,
   `spec/2026-08/redactPDF/`)
2. **Task Name**: The exact name/title of the task to execute from TASKS-VIEW.md

## Example Usage

```
@execute-task.md spec/2026-08/redactPDF/ "Build landing page upload dropzone"
```

## What This Command Does

1. **Reads project context** from the specified directory:

   - GOAL.md (project objectives)
   - RESEARCH.md (research and analysis)
   - TASKS-TREE-VIEW.md (high-level task breakdown)
   - TASKS-VIEW.md (detailed task specifications)
   - If present, the feedback file (TASK-FEEDBACK.md)

2. **Locates the specific task** by searching for the provided task name in
   TASKS-VIEW.md

3. **Executes the task** by:

   - Following the detailed specifications in the task
   - Implementing the required code changes
   - Creating necessary files and components

4. **Performs additional research** as needed to understand:
   - Existing codebase patterns and similar components
   - Required dependencies and imports
   - Integration points with other systems

## Error Handling

If the task specification is:

- **Incorrect or outdated**: I'll ask for clarification on the specific issues
- **Impossible to implement**: I'll explain why and suggest alternatives
- **Challenging or unclear**: I'll ask for additional context or guidance

Also, if the task is to build or integrate a React component, ask the user
to provide a screenshot of the component (if it's not linked to in the "Design"
bullet in the spec already)

## Parameters

- `$1`: Directory path (required) - e.g., `spec/2026-08/redactPDF/`
- `$2`: Task name (required) - task title from TASKS-VIEW.md

## Response Format

If parameters are missing, I'll respond with:

```
I'm ready to execute a specific task. Please provide:

1. Directory: The subfolder with the project specifications (e.g.,
   spec/2026-08/redactPDF/)
2. Task Name: The exact task title from TASKS-VIEW.md (e.g.,
   "Build landing page upload dropzone")

Usage: @execute-task.md <directory> "<task-name>"
```

## Implementation Approach

- Follow existing codebase patterns and conventions
- Use the project's preferred libraries and frameworks
- Implement comprehensive error handling
- Create appropriate tests and documentation
- Ensure integration with existing systems
- Follow the IOIT framework (Inputs, Outputs, Integration, Testing) from the
  task spec
- After finishing the task, run `yarn tsc` to look for typecheck errors and
  fix them

## What the user passed in:

- `$1`: $1
- `$2`: $2
