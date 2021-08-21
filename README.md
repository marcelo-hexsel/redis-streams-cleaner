# redis-streams-cleaner

Clean Redis Streams messages that are were already read by all consumer groups

## Project purpose

Redis Streams are one of the great features of Redis Server.
BUT currently there is no easy way to clear messages on a stream that were already read by all consumer groups.
This library aims to give you an easy way to keep your Redis Streams as little as possible, by creating a safe way to clear messages that were already read by everybody that should do it.

## Tech stack

* [Typescript](https://www.typescriptlang.org/)
* [Yarn](https://yarnpkg.com/)
* [Redis](https://redis.io/)
* [Redis Streams](https://redis.io/topics/streams-intro)
* [Jest](https://jestjs.io/)
* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
