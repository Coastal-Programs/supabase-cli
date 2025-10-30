import { expect } from 'chai'

import DbQuery from '../../../src/commands/db/query'

describe('db:query command', () => {
  it('should have correct description', () => {
    expect(DbQuery.description).to.include('SQL query')
  })

  it('should require sql argument', () => {
    const args = DbQuery.args
    expect(args).to.have.property('sql')
    expect(args.sql.required).to.be.true
  })

  it('should have project flag', () => {
    const flags = DbQuery.flags
    expect(flags).to.have.property('project')
  })

  it('should extend base flags', () => {
    const flags = DbQuery.flags
    expect(flags).to.have.property('format')
    expect(flags).to.have.property('quiet')
    expect(flags).to.have.property('yes')
  })

  it('should have examples', () => {
    expect(DbQuery.examples).to.be.an('array')
    expect(DbQuery.examples.length).to.be.greaterThan(0)
  })

  it('should have aliases', () => {
    expect(DbQuery.aliases).to.be.an('array')
    expect(DbQuery.aliases).to.include('db:sql')
    expect(DbQuery.aliases).to.include('query')
  })
})
