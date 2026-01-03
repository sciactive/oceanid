# SciActive Oceanid

A full text search engine that isn't also a database.

## What is it?

Oceanid is a server that takes keys and text as input. You can then give it a full text search query, and it will return the keys that have text that matches that search.

Oceanid doesn't actually store any of the text that you give it, meaning Oceanid's data storage requirements are quite a bit smaller than something like a full-text Postgres database or Elastic Search. Oceanid only stores the tokens as output by the [SciActive Tokenizer](https://github.com/sciactive/tokenizer).

## What is it for?

Oceanid is great if the following conditions apply to your data:

- You already have a database for your data or your data isn't from a database (like files instead).
- You don't need the actual **text** back that you put in, just a list of **keys** that match a search (because your data is already stored somewhere else).
- You don't want to use any built-in full text search feature in your existing storage, or your existing storage doesn't offer full text search.

# License

Oceanid
Copyright (C) 2025 SciActive Inc

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
