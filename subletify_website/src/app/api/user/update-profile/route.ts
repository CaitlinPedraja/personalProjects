import { prisma } from "../../../../../prisma"; 
import { NextResponse } from 'next/server';


export async function PATCH(req: Request) {
  console.log("Received PATCH request"); 

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { email, fullName, bio } = body;

    if (!email || !fullName || !bio) {
      console.error("Missing fields in request body");
      return NextResponse.json({ error: "Missing required fields: email, fullName, bio" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: fullName, bio },
    });
    console.log("User updated successfully:", updatedUser);

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error); 
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

