Reserved for U.S. territory jurisdiction files (American Samoa `AS`,
Guam `GU`, Northern Mariana Islands `MP`, Puerto Rico `PR`, U.S. Virgin
Islands `VI`), one file per territory, same schema as `data/states/`
(see the top-level README.md and `validate_jurisdictions.py`).

Empty for now — `js/states.js` already checks this directory as a
fallback after `data/states/`, so no code changes will be needed here
when the first territory file is added.
