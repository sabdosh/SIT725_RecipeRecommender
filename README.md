# SIT725_RecipeRecommender

## Frontend–Backend API Contract (MVP)

The frontend and backend communicate via a simple, agreed-upon API contract to allow parallel development.

Endpoint:
POST /api/recipes/generate

Request:
{
  "ingredients": string
}

Response:
{
  "recipes": [
    {
      "title": string,
      "missingIngredients": string[],
      "steps": string[]
    }
  ]
}

This contract is intentionally minimal and may be backed by a stubbed response during MVP development.

