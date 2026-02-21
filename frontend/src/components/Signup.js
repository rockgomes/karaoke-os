import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Alert,
} from "@heroui/react";
import { HeadphonesIcon } from "@heroui/shared-icons";

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/register", {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      onSignup(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HeadphonesIcon className="w-6 h-6 text-primary" />
            Create Account
          </h2>
          <p className="text-default-500 text-sm">
            Sign up to manage your personal karaoke song list
          </p>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isRequired
              isDisabled={loading}
              placeholder="your@email.com"
            />

            <Input
              type="text"
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              isRequired
              isDisabled={loading}
              placeholder="Choose a username"
            />

            <Input
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isRequired
              isDisabled={loading}
              placeholder="At least 6 characters"
              minLength={6}
            />

            <Input
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              isRequired
              isDisabled={loading}
              placeholder="Re-enter your password"
            />

            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              isDisabled={loading}
              className="w-full"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardBody>
        <CardFooter className="justify-center">
          <p className="text-small text-default-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
