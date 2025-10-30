import { expect } from 'chai'

import {
  getAvailableQueries,
  getQueryByName,
  hasQuery,
  SQL_QUERIES,
} from '../../src/utils/sql-queries'

describe('SQL Queries Utility', () => {
  describe('SQL_QUERIES', () => {
    it('should have predefined queries', () => {
      expect(SQL_QUERIES).to.be.an('object')
      expect(Object.keys(SQL_QUERIES).length).to.be.greaterThan(0)
    })

    it('should have listExtensions query', () => {
      expect(SQL_QUERIES.listExtensions).to.be.a('string')
      expect(SQL_QUERIES.listExtensions).to.include('pg_extension')
    })

    it('should have databaseInfo query', () => {
      expect(SQL_QUERIES.databaseInfo).to.be.a('string')
      expect(SQL_QUERIES.databaseInfo).to.include('current_database()')
    })

    it('should have listTables query', () => {
      expect(SQL_QUERIES.listTables).to.be.a('string')
      expect(SQL_QUERIES.listTables).to.include('information_schema.tables')
    })
  })

  describe('getQueryByName()', () => {
    it('should return query for valid name', () => {
      const query = getQueryByName('listExtensions')
      expect(query).to.be.a('string')
      expect(query).to.include('pg_extension')
    })

    it('should return undefined for invalid name', () => {
      const query = getQueryByName('invalidQueryName')
      expect(query).to.be.undefined
    })
  })

  describe('getAvailableQueries()', () => {
    it('should return array of query names', () => {
      const queries = getAvailableQueries()
      expect(queries).to.be.an('array')
      expect(queries.length).to.be.greaterThan(0)
    })

    it('should include standard queries', () => {
      const queries = getAvailableQueries()
      expect(queries).to.include('listExtensions')
      expect(queries).to.include('databaseInfo')
      expect(queries).to.include('listTables')
    })
  })

  describe('hasQuery()', () => {
    it('should return true for valid query name', () => {
      expect(hasQuery('listExtensions')).to.be.true
      expect(hasQuery('databaseInfo')).to.be.true
    })

    it('should return false for invalid query name', () => {
      expect(hasQuery('invalidQueryName')).to.be.false
      expect(hasQuery('')).to.be.false
    })
  })
})
