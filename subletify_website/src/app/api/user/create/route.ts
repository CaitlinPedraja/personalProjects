import { prisma } from "../../../../../prisma";
import { hashPassword } from "../../../utils";
import { NextRequest } from "next/server";


export async function POST (req: NextRequest) {
   await createUserHandler(req);
   return new Response('Worked!');
}


// function to create user in our database
async function createUserHandler(req: NextRequest) {
  let errors = [];
  const body = await req.json()
  const { email, password } = body;
  if (password.length < 6) {
    errors.push("password length should be more than 6 characters");
    return new Response(errors[0], { status: 400})
  }
  const user = await prisma.user.create({
    data: { email, password: hashPassword(password) },
  });
  if (!user) {
    return new Response("Error, user exists", { status: 400})
  }
  return new Response("Success, user created", { status: 200})
}