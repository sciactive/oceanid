# SciActive Oceanid

A full text search engine that isn't also a database.

NOTICE: Oceanid is in very early development, and currently does not work. Therefore, don't use it yet.

## What is it?

Oceanid is a server that takes keys and text as input. You can then give it a full text search query, and it will return the keys that have text that matches that search.

Oceanid doesn't actually store any of the text that you give it, meaning Oceanid's data storage requirements are quite a bit smaller than something like a full-text Postgres database or Elastic Search. Oceanid only stores the tokens as output by the [SciActive Tokenizer](https://github.com/sciactive/tokenizer).

## What is it for?

Oceanid is great if the following conditions apply to your data:

- You already have a database for your data or your data isn't from a database (like files instead).
- You don't need the actual **text** back that you put in, just a list of **keys** that match a search (because your data is already stored somewhere else).
- You don't want to use any built-in full text search feature in your existing storage, or your existing storage doesn't offer full text search.

# What does the AGPL licensing mean?

Oceanid being under the AGPL means you can freely bring up an Oceanid server for your app and use it just like you would use any other server. It **does not** mean you need to release your app under the same license. Oceanid runs as a standalone server, and therefore is not part of your app, and its license doesn't extend to your app.

If you run an unmodified Oceanid server, you do not need to provide the source code to your users. You can simply point them to the Oceanid repository if they ever ask.

If you are running a modified Oceanid server, you may need to provide the modified Oceanid source code to your users, if your users have access to the server, but not if you are only using it as a backend service for your app.

See here for more detail: https://medium.com/swlh/understanding-the-agpl-the-most-misunderstood-license-86fd1fe91275

# License

Oceanid
Copyright (C) 2026 SciActive Inc

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
