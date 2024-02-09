type Params = {
  params: {
    app_slug: string;
  };
};

export function GET(req: Request, { params }: Params) {
  const { app_slug } = params;

  return new Response(`Hello ${app_slug}!`);
}
