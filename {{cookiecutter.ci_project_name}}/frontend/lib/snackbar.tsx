import { useSnackbar } from "notistack";

export function useEasySnackbar() {
  const { enqueueSnackbar } = useSnackbar();
  return {
    showSuccess: (message: string) =>
      enqueueSnackbar(message, { variant: "success" }),
    showSnackbar: (message: string, options?: any) =>
      enqueueSnackbar(message, options),
    showError: (error: any, message: string) => {
      console.error("Snackbar Error:", error);
      const firstGQLError = error ? error?.graphQLErrors?.[0] : {}
      const errorMessage = firstGQLError?.extensions?.validationErrors?.[0]?.meta?.message ||
        firstGQLError?.message || error?.message || error ? error.toString() : "";
      enqueueSnackbar(
        message ? (
          <>
            {message}
            <br />
            {errorMessage}
          </>
        ) : (
          `${errorMessage}`
        ),
        { variant: "error" }
      );
    },
  };
}
