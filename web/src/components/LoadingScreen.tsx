import {Spinner, Stack, Text } from "@chakra-ui/react";
import { IoAlert } from "react-icons/io5";

export function LoadingScreen(props: { error: string | undefined }) {
    return <Stack
        width="100vw"
        height="100vh"
        wrap="nowrap"
        justifyContent="center"
        alignItems="center"
    >
        { !props.error ? <Spinner /> : <IoAlert />}
        <Text color={props.error ? "red.400" : undefined}>{ props.error ?? "Loading data" }</Text>
    </Stack>
}
