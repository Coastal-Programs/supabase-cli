#!/bin/bash

# Stress Testing Script for Supabase CLI
# Tests performance, reliability, and functionality

export SUPABASE_ACCESS_TOKEN="sbp_60002377ce2b4e76519fdf3df2b09750323098d2"
PROJECT="ygzhmowennlaehudyyey"
CLI="./bin/run"

echo "=== SUPABASE CLI STRESS TEST ==="
echo "Project: $PROJECT"
echo "Started: $(date)"
echo ""

# Performance tracking
declare -A timings
declare -A statuses

run_test() {
    local name=$1
    local command=$2

    echo -n "Testing $name... "

    start=$(date +%s%N)
    output=$($command 2>&1)
    exit_code=$?
    end=$(date +%s%N)

    duration=$(( (end - start) / 1000000 )) # Convert to ms

    timings[$name]=$duration
    statuses[$name]=$exit_code

    if [ $exit_code -eq 0 ]; then
        echo "✓ ${duration}ms"
    else
        echo "✗ ${duration}ms (exit code: $exit_code)"
    fi
}

echo "=== PROJECT COMMANDS ==="
run_test "projects:list" "$CLI projects:list --format json --quiet"
run_test "projects:get" "$CLI projects:get --project $PROJECT --format json --quiet"

echo ""
echo "=== DATABASE COMMANDS ==="
run_test "db:schemas" "$CLI db:schemas --project $PROJECT --format json --quiet"
run_test "db:connections" "$CLI db:connections --project $PROJECT --format json --quiet"
run_test "db:extensions" "$CLI db:extensions --project $PROJECT --format json --quiet"
run_test "db:info" "$CLI db:info --project $PROJECT --format json --quiet"
run_test "db:user-info" "$CLI db:user-info --project $PROJECT --format json --quiet"
run_test "db:table-sizes" "$CLI db:table-sizes --project $PROJECT --format json --quiet"

echo ""
echo "=== BACKUP COMMANDS ==="
run_test "backup:list" "$CLI backup:list --project $PROJECT --format json --quiet"

echo ""
echo "=== SECURITY COMMANDS ==="
run_test "security:audit" "$CLI security:audit --project $PROJECT --format json --quiet"

echo ""
echo "=== SUMMARY ==="
echo "Total tests: ${#statuses[@]}"

passed=0
failed=0
for test in "${!statuses[@]}"; do
    if [ ${statuses[$test]} -eq 0 ]; then
        ((passed++))
    else
        ((failed++))
    fi
done

echo "Passed: $passed"
echo "Failed: $failed"
echo ""

echo "=== PERFORMANCE ==="
for test in "${!timings[@]}"; do
    printf "%-30s %6dms\n" "$test" "${timings[$test]}"
done | sort -t: -k2 -n

echo ""
echo "Finished: $(date)"
