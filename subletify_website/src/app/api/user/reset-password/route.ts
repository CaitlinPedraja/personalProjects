import { prisma } from "../../../../../prisma";
import jwt from "jsonwebtoken";
import { hashPassword } from "../../../utils";
import nodemailer from "nodemailer";

// email the reset link
export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: "Invalid inputs" }), { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "There is no account with this email." }), { status: 404 });
    }

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ email: email }, secret, { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `http://localhost:3000/resetPassword/${token}`;

    const mailOptions = {
      from: '"Subletify" <subletify.contact@gmail.com>',
      to: user.email || "default-email@example.com",
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
    
    return new Response(JSON.stringify({ message: "Password reset link sent!" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Error sending password reset link" }), { status: 500 });
  }
}

//update the db with new database
export async function PATCH(req: Request) {
  try {
    const body = await req.text(); 

    if (!body) {
      return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400 });
    }

    const { token, newPassword } = JSON.parse(body); 

    if (!token || !newPassword) {
      return new Response(JSON.stringify({ error: "Invalid inputs" }), { status: 400 });
    }

    const secret = process.env.JWT_SECRET as string;
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 400 });
    }

    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.email) {
      return new Response(JSON.stringify({ error: "Invalid token data" }), { status: 400 });
    }

    const email = decodedToken.email;

    await prisma.user.update({
      where: { email: email },
      data: { password: hashPassword(newPassword) },
    });

    return new Response(JSON.stringify({ message: "Password reset successfully!" }), { status: 200 });

  } catch (error) {
    console.error("Error resetting password:", error);
    return new Response(JSON.stringify({ error: "Error resetting password" }), { status: 500 });
  }
}

