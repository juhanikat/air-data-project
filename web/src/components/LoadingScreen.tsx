import {Spinner, Stack, Text } from "@chakra-ui/react";
import { IoAlert } from "react-icons/io5";

export function LoadingScreen(props: { error: string | undefined, text?: string | undefined }) {
    return <Stack
        width="100%"
        height="100%"
        wrap="nowrap"
        justifyContent="center"
        alignItems="center"
    >
        { !props.error ? <Spinner /> : <IoAlert />}
        <Text color={props.error ? "red.400" : undefined}>{ props.error ?? props.text ?? "Loading data" }</Text>
    </Stack>
}
