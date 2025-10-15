// Event Grid Topic Module
// Creates an Event Grid Topic for event-driven architecture

@description('Event Grid Topic name')
param topicName string

@description('Location for the Event Grid Topic')
param location string = resourceGroup().location

@description('Tags for the resource')
param tags object = {}

resource eventGridTopic 'Microsoft.EventGrid/topics@2023-12-15-preview' = {
  name: topicName
  location: location
  tags: tags
  properties: {
    inputSchema: 'EventGridSchema'
    publicNetworkAccess: 'Enabled' // DEV: Enabled; PROD: consider privateEndpoints
  }
}

@description('Event Grid Topic name')
output topicName string = eventGridTopic.name

@description('Event Grid Topic ID')
output topicId string = eventGridTopic.id

@description('Event Grid Topic endpoint')
output topicEndpoint string = eventGridTopic.properties.endpoint
