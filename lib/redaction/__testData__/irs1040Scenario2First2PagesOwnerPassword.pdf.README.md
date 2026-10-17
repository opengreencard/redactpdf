# Owner-password copy of the first two IRS Form 1040 test scenario pages

- Source file: `irs1040Scenario2First2Pages.pdf`
- License: Public domain as a work of the United States government
- Attribution: Internal Revenue Service
- Contents: Identical to the source file, encrypted with AES-256.
- Passwords: Empty user password, so it opens without a prompt. Owner
  password `ownerpw` (test-only). This is the restricted-editing case that
  makes `PDFDocument.load` throw without `ignoreEncryption`.
- Created with: `qpdf --encrypt "" ownerpw 256 -- irs1040Scenario2First2Pages.pdf irs1040Scenario2First2PagesOwnerPassword.pdf`
