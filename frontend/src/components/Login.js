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
import { Lock } from "@heroui/shared-icons";

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", credentials);
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <Card className="w-full max-w-md bg-content1/80 backdrop-blur-md border border-default-100 shadow-large">
        <CardHeader className="flex flex-col gap-1 items-center text-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6" fill="currentColor" />
            Login
          </h2>
          <p className="text-default-500 text-sm">
            Sign in to access your karaoke song list
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
              type="text"
              label="Email or Username"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              isRequired
              isDisabled={loading}
            />

            <Input
              type="password"
              label="Password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              isRequired
              isDisabled={loading}
            />

            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              isDisabled={loading}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardBody>
        <CardFooter className="justify-center">
          <p className="text-small text-default-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
