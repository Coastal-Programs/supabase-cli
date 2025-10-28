import { expect } from 'chai'
import { Envelope } from '../src/envelope'

describe('Envelope', () => {
  it('should create success envelope', () => {
    const envelope = Envelope.success({ data: 'test' })
    expect(envelope.success).to.be.true
    expect(envelope.data).to.deep.equal({ data: 'test' })
    expect(envelope.metadata.timestamp).to.be.a('number')
  })

  it('should create error envelope', () => {
    const envelope = Envelope.error('Test error', 'TEST_ERROR', 400)
    expect(envelope.success).to.be.false
    expect(envelope.error.message).to.equal('Test error')
    expect(envelope.error.code).to.equal('TEST_ERROR')
    expect(envelope.error.statusCode).to.equal(400)
  })

  it('should create error envelope from Error object', () => {
    const error = new Error('Test error')
    const envelope = Envelope.fromError(error)
    expect(envelope.success).to.be.false
    expect(envelope.error.message).to.equal('Test error')
  })

  it('should check if envelope is success', () => {
    const success = Envelope.success('data')
    const error = Envelope.error('error')
    expect(Envelope.isSuccess(success)).to.be.true
    expect(Envelope.isSuccess(error)).to.be.false
  })

  it('should check if envelope is error', () => {
    const success = Envelope.success('data')
    const error = Envelope.error('error')
    expect(Envelope.isError(error)).to.be.true
    expect(Envelope.isError(success)).to.be.false
  })

  it('should unwrap success envelope', () => {
    const envelope = Envelope.success('test-data')
    const data = Envelope.unwrap(envelope)
    expect(data).to.equal('test-data')
  })

  it('should throw when unwrapping error envelope', () => {
    const envelope = Envelope.error('Test error')
    expect(() => Envelope.unwrap(envelope)).to.throw('Test error')
  })

  it('should map envelope data', () => {
    const envelope = Envelope.success(5)
    const mapped = Envelope.map(envelope, (n) => n * 2)
    expect(Envelope.unwrap(mapped)).to.equal(10)
  })

  it('should merge multiple success envelopes', () => {
    const envelopes = [Envelope.success(1), Envelope.success(2), Envelope.success(3)]
    const merged = Envelope.merge(envelopes)
    expect(Envelope.unwrap(merged)).to.deep.equal([1, 2, 3])
  })

  it('should fail merge if any envelope is error', () => {
    const envelopes = [Envelope.success(1), Envelope.error('Error'), Envelope.success(3)]
    const merged = Envelope.merge(envelopes)
    expect(Envelope.isError(merged)).to.be.true
  })
})
