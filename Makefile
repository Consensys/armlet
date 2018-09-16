.PHONY: test check lint lint-fix

#: Run lint and then tests
check:
	npm test

#: same thing as "make check"
test: check

#: Look for nodejs lint violations
lint:
	npm run lint

#: Look and fix nodejs lint violations
lint-fix:
	npm run lint-fix
