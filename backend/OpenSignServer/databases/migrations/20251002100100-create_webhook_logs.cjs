/**
 * Create webhook_logs table
 *
 * @param {Parse} Parse
 */
exports.up = async Parse => {
    const className = 'webhook_logs';
    const schema = new Parse.Schema(className);
    schema.addString('subscription_id'); // Reference to webhook subscription
    schema.addString('event'); // Event type
    schema.addString('document_id'); // Document ID
    schema.addString('status'); // Status of webhook delivery
    schema.addNumber('attempt'); // Attempt number
    schema.addString('response'); // Response from webhook endpoint
    schema.addDate('created_at');
    schema.addIndex('subscription_id_index', { subscription_id: 1 });
    schema.addIndex('event_index', { event: 1 });
    return schema.save();
  };
  
  /**
   * Drop webhook_logs table
   *
   * @param {Parse} Parse
   */
  exports.down = async Parse => {
    const className = 'webhook_logs';
    const schema = new Parse.Schema(className);
    return schema.delete();
  };