#!/bin/bash

# Comprehensive Command Testing Script
# Tests ALL commands to find what's broken

export SUPABASE_ACCESS_TOKEN="sbp_60002377ce2b4e76519fdf3df2b09750323098d2"
PROJECT="ygzhmowennlaehudyyey"
CLI="./bin/run"

echo "=========================================="
echo "COMPREHENSIVE CLI COMMAND TEST"
echo "=========================================="
echo "Project: $PROJECT"
echo "Started: $(date)"
echo ""

PASS=0
FAIL=0
SKIP=0

test_command() {
    local name=$1
    local cmd=$2
    local should_fail=$3  # "destructive" or "skip" or empty

    if [ "$should_fail" = "skip" ]; then
        echo "⊘ $name [SKIPPED]"
        ((SKIP++))
        return
    fi

    echo -n "Testing $name... "

    if [ "$should_fail" = "destructive" ]; then
        # Just test --help for destructive commands
        output=$($cmd --help 2>&1)
        if echo "$output" | grep -q "USAGE"; then
            echo "✓ (help works)"
            ((PASS++))
        else
            echo "✗ (help failed)"
            ((FAIL++))
        fi
        return
    fi

    # Run actual command
    output=$($cmd --quiet --format json 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo "✓"
        ((PASS++))
    else
        echo "✗ ($exit_code)"
        echo "  Error: $(echo "$output" | grep -i error | head -1)"
        ((FAIL++))
    fi
}

echo "=== PROJECT COMMANDS ==="
test_command "projects:list" "$CLI projects:list --project $PROJECT"
test_command "projects:get" "$CLI projects:get --project $PROJECT"
test_command "projects:create" "$CLI projects:create" "skip"
test_command "projects:delete" "$CLI projects:delete" "skip"
test_command "projects:pause" "$CLI projects:pause --project $PROJECT" "destructive"
test_command "projects:restore" "$CLI projects:restore --project $PROJECT" "destructive"

echo ""
echo "=== DATABASE COMMANDS ==="
test_command "db:query" "$CLI db:query 'SELECT 1' --project $PROJECT"
test_command "db:schemas" "$CLI db:schemas --project $PROJECT"
test_command "db:extensions" "$CLI db:extensions --project $PROJECT"
test_command "db:connections" "$CLI db:connections --project $PROJECT"
test_command "db:info" "$CLI db:info --project $PROJECT"
test_command "db:user-info" "$CLI db:user-info --project $PROJECT"
test_command "db:table-sizes" "$CLI db:table-sizes --project $PROJECT"
test_command "db:policies" "$CLI db:policies --project $PROJECT"

echo ""
echo "=== BACKUP COMMANDS ==="
test_command "backup:list" "$CLI backup:list --project $PROJECT"
test_command "backup:get" "$CLI backup:get --help" "destructive"
test_command "backup:create" "$CLI backup:create --help" "destructive"
test_command "backup:delete" "$CLI backup:delete --help" "destructive"
test_command "backup:restore" "$CLI backup:restore --help" "destructive"
test_command "backup:schedule:list" "$CLI backup:schedule:list --help" "destructive"
test_command "backup:schedule:create" "$CLI backup:schedule:create --help" "destructive"
test_command "backup:pitr:restore" "$CLI backup:pitr:restore --help" "destructive"

echo ""
echo "=== SECURITY COMMANDS ==="
test_command "security:audit" "$CLI security:audit --project $PROJECT"
test_command "security:restrictions:list" "$CLI security:restrictions:list --project $PROJECT"
test_command "security:restrictions:add" "$CLI security:restrictions:add --help" "destructive"
test_command "security:restrictions:remove" "$CLI security:restrictions:remove --help" "destructive"
test_command "security:policies:list" "$CLI security:policies:list --project $PROJECT"

echo ""
echo "=== BRANCHES COMMANDS ==="
test_command "branches:list" "$CLI branches:list --project $PROJECT"

echo ""
echo "=== CONFIG COMMANDS ==="
test_command "config:doctor" "$CLI config:doctor"

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "Total:   $((PASS + FAIL + SKIP))"
echo "✓ Pass:  $PASS"
echo "✗ Fail:  $FAIL"
echo "⊘ Skip:  $SKIP"
echo ""
echo "Success Rate: $(( PASS * 100 / (PASS + FAIL) ))%"
echo ""
echo "Finished: $(date)"
