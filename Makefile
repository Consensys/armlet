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

RM      ?= rm
GIT2CL ?= git2cl

rmChangeLog:
	rm ChangeLog || true

#: Create a ChangeLog from git via git log and git2cl
ChangeLog: rmChangeLog
	git log --pretty --numstat --summary | $(GIT2CL) >$@
