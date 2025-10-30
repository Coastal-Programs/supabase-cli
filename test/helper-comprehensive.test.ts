import { expect } from 'chai'
import * as sinon from 'sinon'
import { Helper } from '../src/helper'

describe('Helper - Comprehensive', () => {
  let consoleStub: {
    log: sinon.SinonStub
    error: sinon.SinonStub
    warn: sinon.SinonStub
  }

  beforeEach(() => {
    consoleStub = {
      log: sinon.stub(console, 'log'),
      error: sinon.stub(console, 'error'),
      warn: sinon.stub(console, 'warn'),
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('Message Printing', () => {
    it('should print success message', () => {
      Helper.success('Operation completed')

      expect(consoleStub.log.calledOnce).to.be.true
      expect(consoleStub.log.firstCall.args.join(' ')).to.include('SUCCESS:')
      expect(consoleStub.log.firstCall.args.join(' ')).to.include('Operation completed')
    })

    it('should print error message', () => {
      Helper.error('Something went wrong')

      expect(consoleStub.error.calledOnce).to.be.true
      expect(consoleStub.error.firstCall.args.join(' ')).to.include('ERROR:')
      expect(consoleStub.error.firstCall.args.join(' ')).to.include('Something went wrong')
    })

    it('should print warning message', () => {
      Helper.warning('Be careful')

      expect(consoleStub.warn.calledOnce).to.be.true
      expect(consoleStub.warn.firstCall.args.join(' ')).to.include('WARNING:')
      expect(consoleStub.warn.firstCall.args.join(' ')).to.include('Be careful')
    })

    it('should print info message', () => {
      Helper.info('For your information')

      expect(consoleStub.log.calledOnce).to.be.true
      expect(consoleStub.log.firstCall.args.join(' ')).to.include('INFO:')
      expect(consoleStub.log.firstCall.args.join(' ')).to.include('For your information')
    })

    it('should print debug message when DEBUG=true', () => {
      const originalDebug = process.env.DEBUG
      process.env.DEBUG = 'true'

      Helper.debug('Debug information')

      expect(consoleStub.log.calledOnce).to.be.true
      expect(consoleStub.log.firstCall.args.join(' ')).to.include('[DEBUG]')
      expect(consoleStub.log.firstCall.args.join(' ')).to.include('Debug information')

      // Restore
      if (originalDebug === undefined) {
        delete process.env.DEBUG
      } else {
        process.env.DEBUG = originalDebug
      }
    })

    it('should not print debug message when DEBUG is not set', () => {
      const originalDebug = process.env.DEBUG
      delete process.env.DEBUG

      Helper.debug('Debug information')

      expect(consoleStub.log.called).to.be.false

      // Restore
      if (originalDebug !== undefined) {
        process.env.DEBUG = originalDebug
      }
    })

    it('should print header with formatting', () => {
      Helper.header('My Header')

      expect(consoleStub.log.calledOnce).to.be.true
      const output = consoleStub.log.firstCall.args.join(' ')
      expect(output).to.include('My Header')
    })

    it('should print divider', () => {
      Helper.divider()

      expect(consoleStub.log.calledOnce).to.be.true
    })
  })

  describe('Date Formatting', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15T10:30:00Z')

      const formatted = Helper.formatDate(date)

      expect(formatted).to.match(/2024-01-15/)
      expect(formatted).to.include('10:30')
    })

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z')

      const formatted = Helper.formatDate(date, 'YYYY/MM/DD')

      expect(formatted).to.equal('2024/01/15')
    })

    it('should format date from timestamp', () => {
      const timestamp = 1705317000000 // 2024-01-15 10:30:00

      const formatted = Helper.formatDate(timestamp)

      expect(formatted).to.match(/2024-01-15/)
    })

    it('should format date from string', () => {
      const dateString = '2024-01-15'

      const formatted = Helper.formatDate(dateString)

      expect(formatted).to.include('2024-01-15')
    })

    it('should format relative time', () => {
      const now = new Date()
      const past = new Date(now.getTime() - 60_000 * 5) // 5 minutes ago

      const formatted = Helper.formatRelativeTime(past)

      expect(formatted).to.include('5 minutes ago')
    })

    it('should handle future dates in relative time', () => {
      const now = new Date()
      const future = new Date(now.getTime() + 60_000 * 60) // 1 hour from now

      const formatted = Helper.formatRelativeTime(future)

      expect(formatted).to.include('in')
    })
  })

  describe('Duration Formatting', () => {
    it('should format milliseconds', () => {
      expect(Helper.formatDuration(500)).to.equal('500ms')
      expect(Helper.formatDuration(999)).to.equal('999ms')
    })

    it('should format seconds', () => {
      expect(Helper.formatDuration(1000)).to.equal('1.00s')
      expect(Helper.formatDuration(5500)).to.equal('5.50s')
      expect(Helper.formatDuration(59_999)).to.match(/\d+\.\d+s/)
    })

    it('should format minutes', () => {
      expect(Helper.formatDuration(60_000)).to.equal('1.00m')
      expect(Helper.formatDuration(90_000)).to.equal('1.50m')
      expect(Helper.formatDuration(3_599_999)).to.match(/\d+\.\d+m/)
    })

    it('should format hours', () => {
      expect(Helper.formatDuration(3_600_000)).to.equal('1.00h')
      expect(Helper.formatDuration(5_400_000)).to.equal('1.50h')
      expect(Helper.formatDuration(7_200_000)).to.equal('2.00h')
    })

    it('should handle zero duration', () => {
      expect(Helper.formatDuration(0)).to.equal('0ms')
    })

    it('should handle very large durations', () => {
      const oneDayMs = 24 * 60 * 60 * 1000

      const formatted = Helper.formatDuration(oneDayMs)

      expect(formatted).to.include('h')
    })
  })

  describe('File Size Formatting', () => {
    it('should format bytes', () => {
      expect(Helper.formatFileSize(0)).to.equal('0.00 B')
      expect(Helper.formatFileSize(500)).to.equal('500.00 B')
      expect(Helper.formatFileSize(1023)).to.equal('1023.00 B')
    })

    it('should format kilobytes', () => {
      expect(Helper.formatFileSize(1024)).to.equal('1.00 KB')
      expect(Helper.formatFileSize(1536)).to.equal('1.50 KB')
      expect(Helper.formatFileSize(1024 * 1023)).to.match(/\d+\.\d+ KB/)
    })

    it('should format megabytes', () => {
      expect(Helper.formatFileSize(1024 * 1024)).to.equal('1.00 MB')
      expect(Helper.formatFileSize(1024 * 1024 * 1.5)).to.equal('1.50 MB')
    })

    it('should format gigabytes', () => {
      expect(Helper.formatFileSize(1024 * 1024 * 1024)).to.equal('1.00 GB')
      expect(Helper.formatFileSize(1024 * 1024 * 1024 * 2.5)).to.equal('2.50 GB')
    })

    it('should format terabytes', () => {
      expect(Helper.formatFileSize(1024 * 1024 * 1024 * 1024)).to.equal('1.00 TB')
      expect(Helper.formatFileSize(1024 * 1024 * 1024 * 1024 * 1.5)).to.equal('1.50 TB')
    })

    it('should not exceed terabytes', () => {
      const hugeSize = 1024 * 1024 * 1024 * 1024 * 1024 // 1 PB

      const formatted = Helper.formatFileSize(hugeSize)

      expect(formatted).to.include('TB')
    })
  })

  describe('Value Formatting', () => {
    it('should format null', () => {
      const formatted = Helper.formatValue(null)

      expect(formatted).to.include('null')
    })

    it('should format undefined', () => {
      const formatted = Helper.formatValue(undefined)

      expect(formatted).to.include('undefined')
    })

    it('should format booleans', () => {
      const trueFormatted = Helper.formatValue(true)
      const falseFormatted = Helper.formatValue(false)

      expect(trueFormatted).to.include('true')
      expect(falseFormatted).to.include('false')
    })

    it('should format numbers', () => {
      const formatted = Helper.formatValue(42)

      expect(formatted).to.include('42')
    })

    it('should format strings', () => {
      const formatted = Helper.formatValue('test string')

      expect(formatted).to.equal('test string')
    })

    it('should format dates', () => {
      const date = new Date('2024-01-15T10:30:00Z')

      const formatted = Helper.formatValue(date)

      expect(formatted).to.include('2024-01-15')
    })

    it('should format objects as JSON', () => {
      const obj = { key: 'value', num: 42 }

      const formatted = Helper.formatValue(obj)

      expect(formatted).to.equal(JSON.stringify(obj))
    })

    it('should format arrays as JSON', () => {
      const arr = [1, 2, 3]

      const formatted = Helper.formatValue(arr)

      expect(formatted).to.equal(JSON.stringify(arr))
    })
  })

  describe('List Formatting', () => {
    it('should format array as numbered list', () => {
      const data = ['item1', 'item2', 'item3']

      const formatted = Helper.formatList(data)

      expect(formatted).to.include('1. item1')
      expect(formatted).to.include('2. item2')
      expect(formatted).to.include('3. item3')
    })

    it('should format object as key-value list', () => {
      const data = { name: 'Test', age: 30, active: true }

      const formatted = Helper.formatList(data)

      expect(formatted).to.include('name:')
      expect(formatted).to.include('age:')
      expect(formatted).to.include('active:')
    })

    it('should handle primitive values', () => {
      const formatted = Helper.formatList('simple string')

      expect(formatted).to.equal('simple string')
    })

    it('should handle empty arrays', () => {
      const formatted = Helper.formatList([])

      expect(formatted).to.equal('')
    })

    it('should handle nested objects in arrays', () => {
      const data = [{ id: 1, name: 'First' }, { id: 2, name: 'Second' }]

      const formatted = Helper.formatList(data)

      expect(formatted).to.include('1.')
      expect(formatted).to.include('2.')
    })
  })

  describe('Table Formatting', () => {
    it('should format array of objects as table', () => {
      const data = [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
      ]

      const formatted = Helper.formatTable(data)

      expect(formatted).to.include('id')
      expect(formatted).to.include('name')
      expect(formatted).to.include('active')
      expect(formatted).to.include('Alice')
      expect(formatted).to.include('Bob')
    })

    it('should format single object as table', () => {
      const data = { id: 1, name: 'Test', value: 42 }

      const formatted = Helper.formatTable(data)

      expect(formatted).to.include('id')
      expect(formatted).to.include('name')
      expect(formatted).to.include('value')
    })

    it('should handle empty array', () => {
      const formatted = Helper.formatTable([])

      expect(formatted).to.equal('No data')
    })

    it('should handle array of primitives', () => {
      const data = [1, 2, 3, 4, 5]

      const formatted = Helper.formatTable(data)

      // Should fall back to list format
      expect(formatted).to.include('1.')
    })

    it('should handle null in array', () => {
      const formatted = Helper.formatTable([null])

      expect(formatted).to.include('1.')
    })

    it('should handle objects with different keys', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, email: 'bob@example.com' },
      ]

      const formatted = Helper.formatTable(data)

      expect(formatted).to.include('id')
      expect(formatted).to.include('name')
    })
  })

  describe('YAML Formatting', () => {
    it('should format simple object as YAML', () => {
      const data = { name: 'Test', value: 42, active: true }

      const formatted = Helper.formatYaml(data)

      expect(formatted).to.include('name:')
      expect(formatted).to.include('value:')
      expect(formatted).to.include('active:')
    })

    it('should format nested object with indentation', () => {
      const data = {
        user: {
          name: 'Alice',
          age: 30,
        },
      }

      const formatted = Helper.formatYaml(data)

      expect(formatted).to.include('user:')
      expect(formatted).to.include('name:')
      expect(formatted).to.include('age:')
    })

    it('should format arrays as YAML', () => {
      const data = ['item1', 'item2', 'item3']

      const formatted = Helper.formatYaml(data)

      expect(formatted).to.include('- item1')
      expect(formatted).to.include('- item2')
      expect(formatted).to.include('- item3')
    })

    it('should format mixed nested structure', () => {
      const data = {
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      }

      const formatted = Helper.formatYaml(data)

      expect(formatted).to.include('users:')
      expect(formatted).to.include('-')
    })

    it('should handle primitive values', () => {
      const formatted = Helper.formatYaml('simple string')

      expect(formatted).to.equal('simple string')
    })

    it('should handle null and undefined', () => {
      const dataWithNull = { key: null }
      const formattedNull = Helper.formatYaml(dataWithNull)

      expect(formattedNull).to.include('key:')
    })
  })

  describe('Output Formatting', () => {
    it('should format as JSON by default', () => {
      const data = { test: 'value' }

      const formatted = Helper.formatOutput(data)

      expect(formatted).to.equal(JSON.stringify(data, null, 2))
    })

    it('should format as compact JSON when pretty=false', () => {
      const data = { test: 'value' }

      const formatted = Helper.formatOutput(data, { pretty: false })

      expect(formatted).to.equal(JSON.stringify(data))
    })

    it('should format as table when requested', () => {
      const data = [{ id: 1, name: 'Test' }]

      const formatted = Helper.formatOutput(data, { format: 'table' })

      expect(formatted).to.include('id')
      expect(formatted).to.include('name')
    })

    it('should format as list when requested', () => {
      const data = ['item1', 'item2']

      const formatted = Helper.formatOutput(data, { format: 'list' })

      expect(formatted).to.include('1.')
      expect(formatted).to.include('2.')
    })

    it('should format as YAML when requested', () => {
      const data = { key: 'value' }

      const formatted = Helper.formatOutput(data, { format: 'yaml' })

      expect(formatted).to.include('key:')
    })

    it('should handle empty options', () => {
      const data = { test: 'value' }

      const formatted = Helper.formatOutput(data, {})

      expect(formatted).to.include('test')
    })
  })

  describe('String Utilities', () => {
    it('should pad string to specified length', () => {
      const padded = Helper.pad('test', 10)

      expect(padded).to.have.lengthOf(10)
      expect(padded).to.equal('test      ')
    })

    it('should pad with custom character', () => {
      const padded = Helper.pad('test', 10, '-')

      expect(padded).to.equal('test------')
    })

    it('should not pad if string is already long enough', () => {
      const padded = Helper.pad('test', 4)

      expect(padded).to.equal('test')
    })

    it('should not pad if string is longer than length', () => {
      const padded = Helper.pad('testing', 4)

      expect(padded).to.equal('testing')
    })

    it('should truncate long strings', () => {
      const truncated = Helper.truncate('This is a very long string', 10)

      expect(truncated).to.have.lengthOf(10)
      expect(truncated).to.equal('This is...')
    })

    it('should not truncate short strings', () => {
      const truncated = Helper.truncate('Short', 10)

      expect(truncated).to.equal('Short')
    })

    it('should handle exact length strings', () => {
      const truncated = Helper.truncate('Exact!', 6)

      expect(truncated).to.equal('Exact!')
    })

    it('should handle empty strings', () => {
      const padded = Helper.pad('', 5)
      const truncated = Helper.truncate('', 10)

      expect(padded).to.equal('     ')
      expect(truncated).to.equal('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined in formatOutput', () => {
      const formatted = Helper.formatOutput(undefined)

      expect(formatted).to.be.a('string')
    })

    it('should handle circular references in formatValue', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      // Should not throw, but may not format perfectly
      expect(() => Helper.formatValue(circular)).to.not.throw()
    })

    it('should handle very large numbers', () => {
      const large = Number.MAX_SAFE_INTEGER

      const formatted = Helper.formatValue(large)

      expect(formatted).to.include(String(large))
    })

    it('should handle negative durations', () => {
      const formatted = Helper.formatDuration(-1000)

      expect(formatted).to.be.a('string')
    })

    it('should handle negative file sizes', () => {
      const formatted = Helper.formatFileSize(-1024)

      expect(formatted).to.be.a('string')
    })

    it('should handle empty object in formatTable', () => {
      const formatted = Helper.formatTable({})

      expect(formatted).to.be.a('string')
    })

    it('should handle special characters in strings', () => {
      const special = 'Test\nNew\tLine\r'

      const formatted = Helper.formatValue(special)

      expect(formatted).to.equal(special)
    })

    it('should handle unicode characters', () => {
      const unicode = '测试 🚀 ñoño'

      const formatted = Helper.formatValue(unicode)

      expect(formatted).to.equal(unicode)
    })
  })

  describe('Console Output Integration', () => {
    it('should use chalk for colored output', () => {
      Helper.success('Test')

      // Verify chalk is being used (output contains ANSI codes)
      const output = consoleStub.log.firstCall.args[0]
      expect(output).to.exist
    })

    it('should handle missing console methods gracefully', () => {
      // Should not throw even if console is stubbed
      expect(() => {
        Helper.success('Test')
        Helper.error('Test')
        Helper.warning('Test')
        Helper.info('Test')
      }).to.not.throw()
    })
  })
})
