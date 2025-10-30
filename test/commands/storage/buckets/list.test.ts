import { expect } from 'chai'

import StorageBucketsList from '../../../../src/commands/storage/buckets/list'

describe('storage:buckets:list command', () => {
  it('should have correct description', () => {
    expect(StorageBucketsList.description).to.include('storage buckets')
  })

  it('should have project flag', () => {
    const flags = StorageBucketsList.flags
    expect(flags).to.have.property('project')
  })

  it('should extend base flags', () => {
    const flags = StorageBucketsList.flags
    expect(flags).to.have.property('format')
    expect(flags).to.have.property('quiet')
    expect(flags).to.have.property('debug')
  })

  it('should have examples', () => {
    expect(StorageBucketsList.examples).to.be.an('array')
    expect(StorageBucketsList.examples.length).to.be.greaterThan(0)
  })

  it('should have alias', () => {
    expect(StorageBucketsList.aliases).to.be.an('array')
    expect(StorageBucketsList.aliases).to.include('storage:buckets:ls')
  })

  it('should support multiple output formats', () => {
    const flags = StorageBucketsList.flags
    expect(flags.format).to.have.property('options')
    expect(flags.format.options).to.include('json')
    expect(flags.format.options).to.include('table')
    expect(flags.format.options).to.include('yaml')
  })

  it('should support quiet mode', () => {
    const flags = StorageBucketsList.flags
    expect(flags).to.have.property('quiet')
    expect(flags.quiet.default).to.be.false
  })
})
