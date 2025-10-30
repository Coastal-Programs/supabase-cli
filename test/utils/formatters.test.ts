import { expect } from 'chai'

import { OutputFormatter } from '../../src/utils/formatters'

describe('OutputFormatter', () => {
  let formatter: OutputFormatter

  beforeEach(() => {
    formatter = new OutputFormatter()
  })

  describe('formatSize', () => {
    it('should format large sizes with red color', () => {
      const result = formatter.formatSize('15.5 GB')
      expect(result).to.include('15.5 GB')
    })

    it('should format medium sizes with yellow color', () => {
      const result = formatter.formatSize('2.5 GB')
      expect(result).to.include('2.5 GB')
    })

    it('should format small sizes with green color', () => {
      const result = formatter.formatSize('500 MB')
      expect(result).to.include('500 MB')
    })

    it('should handle unparseable strings', () => {
      const result = formatter.formatSize('unknown')
      expect(result).to.equal('unknown')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes to GB', () => {
      const result = formatter.formatBytes(2147483648) // 2 GB
      expect(result).to.include('2.00 GB')
    })

    it('should format bytes to MB', () => {
      const result = formatter.formatBytes(10485760) // 10 MB
      expect(result).to.include('10.00 MB')
    })

    it('should format bytes to KB', () => {
      const result = formatter.formatBytes(2048) // 2 KB
      expect(result).to.include('2.00 KB')
    })

    it('should format small bytes', () => {
      const result = formatter.formatBytes(512)
      expect(result).to.include('512 bytes')
    })
  })

  describe('formatConnectionState', () => {
    it('should format active state with green color', () => {
      const result = formatter.formatConnectionState('active')
      expect(result).to.include('Active')
    })

    it('should format idle state with yellow color', () => {
      const result = formatter.formatConnectionState('idle')
      expect(result).to.include('Idle')
    })

    it('should format idle in transaction with red color', () => {
      const result = formatter.formatConnectionState('idle in transaction')
      expect(result).to.include('Idle in TX')
    })

    it('should return unknown states as-is', () => {
      const result = formatter.formatConnectionState('unknown')
      expect(result).to.equal('unknown')
    })
  })

  describe('formatStatus', () => {
    it('should format true as enabled', () => {
      const result = formatter.formatStatus(true)
      expect(result).to.include('Enabled')
    })

    it('should format false as disabled', () => {
      const result = formatter.formatStatus(false)
      expect(result).to.include('Disabled')
    })

    it('should format string "true" as enabled', () => {
      const result = formatter.formatStatus('true')
      expect(result).to.include('Enabled')
    })

    it('should format string "enabled" as enabled', () => {
      const result = formatter.formatStatus('enabled')
      expect(result).to.include('Enabled')
    })
  })

  describe('formatPolicyEnforcement', () => {
    it('should format permissive policy', () => {
      const result = formatter.formatPolicyEnforcement('PERMISSIVE')
      expect(result).to.include('Permissive')
    })

    it('should format restrictive policy', () => {
      const result = formatter.formatPolicyEnforcement('RESTRICTIVE')
      expect(result).to.include('Restrictive')
    })
  })

  describe('formatVersion', () => {
    it('should highlight version number', () => {
      const result = formatter.formatVersion('PostgreSQL 15.1 on x86_64')
      expect(result).to.include('15.1')
    })

    it('should handle versions without matches', () => {
      const result = formatter.formatVersion('Unknown Version')
      expect(result).to.include('Unknown Version')
    })
  })

  describe('formatTableType', () => {
    it('should format base table', () => {
      const result = formatter.formatTableType('BASE TABLE')
      expect(result).to.include('Table')
    })

    it('should format view', () => {
      const result = formatter.formatTableType('VIEW')
      expect(result).to.include('View')
    })

    it('should format materialized view', () => {
      const result = formatter.formatTableType('MATERIALIZED VIEW')
      expect(result).to.include('Mat. View')
    })
  })

  describe('formatCommandType', () => {
    it('should format SELECT command', () => {
      const result = formatter.formatCommandType('SELECT')
      expect(result).to.include('SELECT')
    })

    it('should format DELETE command', () => {
      const result = formatter.formatCommandType('DELETE')
      expect(result).to.include('DELETE')
    })
  })

  describe('formatCount', () => {
    it('should format zero with gray', () => {
      const result = formatter.formatCount(0)
      expect(result).to.include('0 rows')
    })

    it('should format small counts with green', () => {
      const result = formatter.formatCount(50)
      expect(result).to.include('50 rows')
    })

    it('should format large counts with yellow', () => {
      const result = formatter.formatCount(150)
      expect(result).to.include('150 rows')
    })
  })

  describe('formatDuration', () => {
    it('should format fast queries with green', () => {
      const result = formatter.formatDuration(5)
      expect(result).to.include('5.00ms')
    })

    it('should format slow queries with red', () => {
      const result = formatter.formatDuration(1500)
      expect(result).to.include('1.50s')
    })
  })

  describe('formatPercentage', () => {
    it('should format low percentage with green', () => {
      const result = formatter.formatPercentage(50)
      expect(result).to.include('50.0%')
    })

    it('should format high percentage with red', () => {
      const result = formatter.formatPercentage(95)
      expect(result).to.include('95.0%')
    })
  })

  describe('createTable', () => {
    it('should create a formatted table', () => {
      const table = formatter.createTable(
        ['Name', 'Value'],
        [
          ['row1', 'value1'],
          ['row2', 'value2'],
        ],
      )
      expect(table).to.be.a('string')
      expect(table.length).to.be.greaterThan(0)
    })

    it('should handle empty rows', () => {
      const table = formatter.createTable(['Name', 'Value'], [])
      expect(table).to.be.a('string')
    })
  })

  describe('createKeyValueTable', () => {
    it('should create a key-value table', () => {
      const table = formatter.createKeyValueTable({
        Database: 'postgres',
        Size: '1.5 GB',
      })
      expect(table).to.be.a('string')
      expect(table.length).to.be.greaterThan(0)
    })
  })

  describe('formatValue', () => {
    it('should format null', () => {
      const result = formatter.formatValue(null)
      expect(result).to.include('null')
    })

    it('should format undefined', () => {
      const result = formatter.formatValue(undefined)
      expect(result).to.include('undefined')
    })

    it('should format boolean true', () => {
      const result = formatter.formatValue(true)
      expect(result).to.include('true')
    })

    it('should format boolean false', () => {
      const result = formatter.formatValue(false)
      expect(result).to.include('false')
    })

    it('should format numbers', () => {
      const result = formatter.formatValue(42)
      expect(result).to.include('42')
    })

    it('should format strings', () => {
      const result = formatter.formatValue('test')
      expect(result).to.equal('test')
    })

    it('should format objects as JSON', () => {
      const result = formatter.formatValue({ key: 'value' })
      expect(result).to.include('key')
      expect(result).to.include('value')
    })
  })
})
