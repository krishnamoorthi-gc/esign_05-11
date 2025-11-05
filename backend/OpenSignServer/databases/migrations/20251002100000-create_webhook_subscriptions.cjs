/**
 * Create webhook_subscriptions table
 *
 * @param {Parse} Parse
 */
exports.up = async Parse => {
    const className = 'webhook_subscriptions';
    const schema = new Parse.Schema(className);
    schema.addString('company_id'); // Reference to company/tenant
    schema.addString('url'); // Webhook URL
    schema.addArray('events'); // Array of subscribed events
    schema.addString('secret_token'); // Secret for HMAC signature
    schema.addDate('created_at');
    schema.addDate('updated_at');
    schema.addIndex('company_id_index', { company_id: 1 });
    return schema.save();
  };
  
  /**
   * Drop webhook_subscriptions table
   *
   * @param {Parse} Parse
   */
  exports.down = async Parse => {
    const className = 'webhook_subscriptions';
    const schema = new Parse.Schema(className);
    return schema.delete();
  };