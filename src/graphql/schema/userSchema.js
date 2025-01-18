export const userTypeDefs = `
    type User {
        id: ID!
        name: String!
        email: String!
        role: String!
        assignedTasks: [Task!]!
        status: String!
    }

    type Query{
        users: [User!]!
           
    }
    
    type Mutation{
        createUser(name: String!, email: String!, password: String!, role: String!, status: String): User!
    }
`;
