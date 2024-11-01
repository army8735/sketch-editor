const path = require('path');
const fs = require('fs');

module.exports = {
  'init': function(browser) {
    browser
      .url('file://' + path.join(__dirname, 'index.html'))
      .waitForElementVisible('body', 1000)
      .pause(20)
      .assert.value('input', 'data:image/png;base64,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ESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBD1OkFgAABnFSURBVAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIECBAgACBYQEFfThcqxEgQIAAAQIECBAgQIBAj4CC3pOVSQkQIECAAAECBAgQIEBgWEBBHw7XagQIECBAgAABAgQIECDQI6Cg92RlUgIECBAgQIAAAQIECBAYFlDQh8O1GgECBAgQIECAAAECBAj0CCjoPVmZlAABAgQIECBAgAABAgSGBRT04XCtRoAAAQIECBAgQIAAAQI9Agp6T1YmJUCAAAECBAgQIECAAIFhAQV9OFyrESBAgAABAgQIECBAgECPgILek5VJCRAgQIAAAQIECBAgQGBYQEEfDtdqBAgQIECAAAECBAgQINAjoKD3ZGVSAgQIECBAgAABAgQIEBgWUNCHw7UaAQIECBAgQIAAAQIECPQIKOg9WZmUAAECBAgQIECAAAECBIYFFPThcK1GgAABAgQIECBAgAABAj0CCnpPViYlQIAAAQIECBAgQIAAgWEBBX04XKsRIECAAAECBAgQIECAQI+Agt6TlUkJECBAgAABAgQIECBAYFhAQR8O12oECBAgQIAAAQIECBAg0COgoPdkZVICBAgQIECAAAECBAgQGBZQ0IfDtRoBAgQIECBAgAABAgQI9Ago6D1ZmZQAAQIECBAgQIAAAQIEhgUU9OFwrUaAAAECBAgQIECAAAECPQIKek9WJiVAgAABAgQIEPhH+3VQBAAAQECwf2s53GwD1gsBAgQIhAUc9PC4qhEgQIAAAQIECBAgQIDAj4CD/rOVpAQIECBAgAABAgQIECAQFnDQw+OqRoAAAQIECBAgQIAAAQI/Ag76z1aSEiBAgAABAgQIECBAgEBYwEEPj6saAQIECBAgQIAAAQIECPwIOOg/W0lKgAABAgQIECBAgAABAmEBBz08rmoECBAgQIAAAQIECBAg8CPgoP9sJSkBAgQIECBAgAABAgQIhAUc9PC4qhEgQIAAAQIECBAgQIDAj4CD/rOVpAQIECBAgAABAgQIECAQFnDQw+OqRoAAAQIECBAgQIAAAQI/Ag76z1aSEiBAgAABAgQIECBAgEBYwEEPj6saAQIECBAgQIAAAQIECPwIOOg/W0lKgAABAgQIECBAgAABAmEBBz08rmoECBAgQIAAAQIECBAg8CPgoP9sJSkBAgQIECBAgAABAgQIhAUc9PC4qhEgQIAAAQIECBAgQIDAj4CD/rOVpAQIECBAgAABAgQIECAQFnDQw+OqRoAAAQIECBAgQIAAAQI/Ag76z1aSEiBAgAABAgQIECBAgEBYwEEPj6saAQIECBAgQIAAAQIECPwIOOg/W0lKgAABAgQIECBAgAABAmEBBz08rmoECBAgQIAAAQIECBAg8CMwoQBicD5GDWgAAAAASUVORK5CYII=')
      .moveToElement('canvas', 10, 10)
      .mouseButtonClick(0)
      .assert.value('input', '{"left":20,"top":20,"right":494,"bottom":448,"width":474,"height":428,"points":[{"x":20,"y":20},{"x":494,"y":20},{"x":494,"y":448},{"x":20,"y":448}]}')
      .mouseButtonClick(0)
      .assert.value('input', '{"v":60.33755274261603,"u":2}')
      .end();
  }
};
