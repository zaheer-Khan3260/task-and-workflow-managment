export const taskTypeDefs = `
    type Task {
    id: ID!
    title: String!
    description: String!
    parentTaskId: Task
    status: TaskStatus!
    assignedUsers: [User]
    dependencies: [Task]
    createdAt: String!
    updatedAt: String!
    versioning: TaskVersioning!
    dueDate: String!
}

type TaskStatus {
    currentStatus: String!
    history: [TaskStatusHistory]
}

type TaskStatusHistory {
    status: String!
    changedAt: String!
    changedBy: User!
}

type TaskVersioning {
    currentVersion: Int!
    history: [TaskVersioningHistory]
}

type TaskVersioningHistory {
    version: Int!
    changes: String!
    updatedAt: String!
    updatedBy: User!
}

input UpdateTaskInput {
    title: String
    description: String
    dueDate: String
}

type DeleteTaskResponse {
    success: Boolean!
    id: ID!
}

type Query {
    tasks: [Task!]!
}

type Mutation {
    createTask(
        title: String!,
        description: String!,
        dueDate: String!,
        dependencies: [ID],
        parentTaskId: ID,
        assignedUsers: [ID]
    ): Task!

    updateTask(id: ID!, input: UpdateTaskInput!): Task!

    deleteTask(id: ID!): DeleteTaskResponse!

    updateTaskStatus(id: ID!, status: String!): Task!

    assignTask(id: ID!, userId: [ID!]!): Task!
    addDependency(id: ID!, dependencyTaskId: ID!): Task!
}


`;
