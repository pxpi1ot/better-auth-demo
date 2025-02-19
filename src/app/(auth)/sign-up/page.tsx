"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import LoadingButton from "@/components/loading-button";
import Link from "next/link";

import { signUpSchema } from "@/lib/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/auth-client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react"; // 新增导入图标
import { cn } from "@/lib/utils";

export default function SignUp() {
	const [pending, setPending] = useState(false);
	const { toast } = useToast();

	// 控制密码显示/隐藏
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm<z.infer<typeof signUpSchema>>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	// 监控密码输入，计算密码强度（0~100）
	const passwordValue = form.watch("password") || "";
	function computePasswordStrength(password: string): number {
		let score = 0;
		if (password.length >= 6) score += 25;
		if (/[0-9]/.test(password)) score += 25;
		if (/[a-z]/.test(password)) score += 25;
		if (/[A-Z]/.test(password)) score += 25;
		return score;
	}
	const passwordStrength = computePasswordStrength(passwordValue);

	const progressColor =
		passwordStrength == 100 ? "bg-green-500" : passwordStrength >= 75 ? "bg-yellow-500" : "bg-red-500";
	const progressTip = passwordStrength >= 75 ? "通过" : "弱密码";
	const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
		await authClient.signUp.email(
			{
				email: values.email,
				password: values.password,
				name: values.name,
			},
			{
				onRequest: () => {
					setPending(true);
				},
				onSuccess: () => {
					toast({
						title: "Account created",
						description: "Your account has been created. Check your email for a verification link.",
					});
				},
				onError: ctx => {
					console.log("error", ctx);
					toast({
						title: "Something went wrong",
						description: ctx.error.message ?? "Something went wrong.",
					});
				},
			}
		);
		setPending(false);
	};

	return (
		<div className="grow flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-3xl font-bold text-center text-gray-800">Create Account</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{["name", "email", "password", "confirmPassword"].map(field => (
								<FormField
									control={form.control}
									key={field}
									name={field as keyof z.infer<typeof signUpSchema>}
									render={({ field: fieldProps }) => (
										<FormItem>
											<FormLabel className="flex justify-between">
												{field.charAt(0).toUpperCase() + field.slice(1)}{" "}
												{field === "password" && passwordStrength != 0 && (
													<span className={cn("transition-all",passwordStrength >= 75 ? "text-green-500" : "text-red-500")}>
														{progressTip}
													</span>
												)}
											</FormLabel>
											<FormControl>
												{field === "password" ? (
													<div className="relative">
														<Input type={showPassword ? "text" : "password"} {...fieldProps} autoComplete="off" />
														<button
															type="button"
															onClick={e => {
																e.preventDefault();
																setShowPassword(prev => !prev);
															}}
															className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 transition-all"
														>
															{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
														</button>
													</div>
												) : (
													<Input type={field === "email" ? "email" : "text"} {...fieldProps} autoComplete="off" />
												)}
											</FormControl>
											<FormMessage />
											{/* 密码框下添加密码强度提示 */}
											{field === "password" && (
												<div className="flex w-full px-1">
													<Progress value={passwordStrength} className="mt-1 h-1" progressClassName={progressColor} />
												</div>
											)}
										</FormItem>
									)}
								/>
							))}
							<LoadingButton pending={pending}>Sign up</LoadingButton>
						</form>
					</Form>
					<div className="mt-4 text-center text-sm">
						<Link href="/sign-in" className="text-primary hover:underline">
							Already have an account? Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
