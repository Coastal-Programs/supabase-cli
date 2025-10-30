import { expect } from 'chai'

import DbExtensions from '../../../src/commands/db/extensions'

describe('db:extensions command', () => {
  it('should have correct description', () => {
    expect(DbExtensions.description).to.include('database extensions')
  })

  it('should have project flag', () => {
    const flags = DbExtensions.flags
    expect(flags).to.have.property('project')
  })

  it('should extend base flags', () => {
    const flags = DbExtensions.flags
    expect(flags).to.have.property('format')
    expect(flags).to.have.property('quiet')
    expect(flags).to.have.property('yes')
  })

  it('should have output format flags', () => {
    const flags = DbExtensions.flags
    expect(flags).to.have.property('format')
  })

  it('should have examples', () => {
    expect(DbExtensions.examples).to.be.an('array')
    expect(DbExtensions.examples.length).to.be.greaterThan(0)
  })

  it('should have aliases', () => {
    expect(DbExtensions.aliases).to.be.an('array')
    expect(DbExtensions.aliases).to.include('db:ext')
    expect(DbExtensions.aliases).to.include('extensions')
  })

  it('should support automation flags', () => {
    const flags = DbExtensions.flags
    expect(flags).to.have.property('quiet')
    expect(flags).to.have.property('yes')
  })
})
