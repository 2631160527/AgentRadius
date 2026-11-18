name: Bug report
description: Report a reproducible problem
body:
  - type: textarea
    id: repro
    attributes:
      label: Reproduction
      description: Include command, input repository, and actual versus expected output.
    validations:
      required: true
