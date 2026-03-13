#!/bin/bash
# Previously this script copied the Online-IDE embedded build into the
# `custom-generator-codelab/public` folder. The Online-IDE is now served
# as a separate Docker container and removed from this repository.

cat <<'MSG'
Online-IDE removed from this repository.

This repository no longer produces or embeds the Online-IDE build.
The Online-IDE is provided as a separate Docker container and should be
deployed independently.

If you previously relied on this script to prepare local assets, update
your local workflows to fetch/embed the external Online-IDE container or
use the production service instead.

No action performed.
MSG

exit 0
