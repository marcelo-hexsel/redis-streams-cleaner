tools:
	@npm i -g yarn

install:
	@yarn install

lint:
	@yarn lint

test:
	@yarn test $(TEST)

build:	
	@yarn build

clean:
	@yarn clean

functional-test: reset
	@yarn functional-test $(TEST)
	@make down

up: 
	@docker-compose up -d --force-recreate redis

down: 
	@docker-compose down

reset: down up
