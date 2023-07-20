# DACB Website Source

Source code for the DACB website [dacb.org](../dacb.org/), written in Jekyll.

## Extensive Documentation

Dr. Sigg (dacb@bu.edu) has a large file with detailed documentation on setting up your development environment and getting started with working on the DACB website. Please refer to that document for instructions on adding content and administrative tasks.

## File Structure

Config:

- \_config.yml

General site files used in build:

- \_includes
- \_data
- \_plugins
- \_sass

Client-side code:

- assets/ &mdash; stores all of the CSS, JS, and general images for the site

Content folders and files:

- index.html
- 404.html
- site-content-build.html
- search-[language here if applicable].html
- fr/
- pt/
- sw/
- \_pages/
- \_posts/

Media and miscellaneous assets:

- images/
- resources/

Ignored in build:

- \_templates/ &mdash; a set of template files for creating new content on the site

Do not remove:

- google68fbdb494679c692.html &mdash; Google site verification used to help with SEO
- Gemfile
- Gemfile.lock
- Rakefile
- favicon.ico
- manifest.json &mdash; used to make the site a PWA
- site-content-build.yml &mdash; not quite sure what this is, but I think it might be important

## Search Engine

The search engine code is separate from this site and available on the `search-engine` repo. That code should continue to expose a consistent API so that it can be easily accessed by the site. When adding new content to this site, you'll need to build the search engine files and push to GitHub so that the new content is available to be searched.
