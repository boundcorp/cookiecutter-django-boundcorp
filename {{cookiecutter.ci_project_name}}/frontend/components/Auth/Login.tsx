import React, {useCallback, useEffect, useState} from "react";
import {get, useForm} from "react-hook-form";
import {setAuthToken} from "../../lib/auth";
import {parseGQLErrorMessage} from "../../lib/validation";
import {useEasySnackbar} from "../../lib/snackbar";
import {ErrorMessage} from "@hookform/error-message"
import _ from 'lodash'

// mui
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";

import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";

// types
import {
  MutationTokenAuthArgs,
  useMyProfileQuery, useSendLoginCodeMutation,
  useTokenAuthMutation,
} from "../../generated/graphql";
import {Lookup} from "./AuthenticationWizard";

export default function LoginForm({lookup}: { lookup: Lookup }) {
  const {handleSubmit, control, formState, register} = useForm<MutationTokenAuthArgs>();
  const [error, setError] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [tokenAuth, tokenAuthResult] = useTokenAuthMutation();
  const [sendCode, sendCodeResult] = useSendLoginCodeMutation();
  const profileQuery = useMyProfileQuery();
  const snackbar = useEasySnackbar()
  const username = lookup?.result && lookup.result.__typename == "UserAccount" ? lookup.result.username : ""

  const sendCodeDebounced = useCallback((waitSeconds=10) => {
    if (process.browser && username) {
      const lastSent = parseInt(localStorage.getItem("lastSent") || "0")
      if (lastSent + waitSeconds * 1000 < new Date().getTime()) {
        console.debug("Sending code")
        localStorage.setItem("lastSent", new Date().getTime().toString())
        sendCode({variables: {input: {username}}}).then((result) => {
          if (result.data?.sendLoginCode?.__typename === "SendLoginCodeSuccess") {
            setDeliveryMethod(result.data?.sendLoginCode?.deliveryMethod)
          } else if (result.data?.sendLoginCode?.__typename === "Error") {
            setError(result.data?.sendLoginCode?.message)
          } else {
            setError("Please wait a few seconds before sending another code")
          }
        })
      } else {
        console.debug("Debounced sendCode")
      }
    }
  }, [username])

  const _onSubmit = async (input: MutationTokenAuthArgs) => {
    try {
      const result = (await tokenAuth({variables: {...input, username}})).data?.tokenAuth;
      setError("");

      if (result?.token) {
        setAuthToken(result.token, result.refreshToken || "");
        snackbar.showSuccess("Logged in successfully, welcome back!");
        await profileQuery.refetch();
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      snackbar.showError(err, "Error logging in");
      setError(
        parseGQLErrorMessage(err) || "An error occurred, please contact support"
      );
    }
  };

  useEffect(() => {
    sendCodeDebounced(300) // Only send an automatic message once every 5 minutes
    setTimeout(() => {
      setShowResend(true)
    }, 10 * 1000)
  }, [username])

  return (
    <form onSubmit={handleSubmit(_onSubmit)} noValidate>
      <Grid container spacing={2}>
        {deliveryMethod ? <Grid item xs={12} marginTop="1em">
          <Typography variant={"h6"}>{"We Sent a Verification Code to Your " + _.capitalize(deliveryMethod)}</Typography>
        </Grid> : null}
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            label="Username"
            defaultValue={username}
            {...register("username")}
            fullWidth
            required
            disabled
            error={!!get(formState.errors, "username")}
            helperText={
              <ErrorMessage
                errors={formState.errors}
                name={"username"}
              />
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            variant="outlined"
            label="Verification Code"
            fullWidth
            required
            type="password"
            {...register("password")}
            error={!!get(formState.errors, "password")}
          />
        </Grid>
      </Grid>
      {error ? <Grid item xs={12} color="red" marginTop="2em">
        <Typography variant={"body1"}>{error}</Typography>
      </Grid> : null}

      {showResend ? <Grid item xs={12} marginTop="1em">
        <Typography variant={"body1"}>{"Didn't get a code?"} <LoadingButton loading={sendCodeResult.loading} onClick={() => sendCodeDebounced()} color={'secondary'}>Resend Code</LoadingButton></Typography>
      </Grid> : null}

      <Grid item xs={12} sx={{marginTop: "1em"}}>
        <LoadingButton
          type="submit"
          variant="contained"
          color="secondary"
          sx={{fontWeight: 'bold'}}
          loading={tokenAuthResult.loading}
          fullWidth
        >
          Verify Your Account
        </LoadingButton>
      </Grid>
    </form>
  );
};
