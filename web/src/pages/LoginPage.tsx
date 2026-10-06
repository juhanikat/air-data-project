import {
    Box,
  Button,
  Field,
  Fieldset,
  Flex,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react";
import api, { User } from "../services/api"
import { useState } from "react";


function LoginPage(props: { setUser: (user: User) => void }){
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    return (
        <Flex width="100%" height="100%" justifyContent="center" alignItems="center">
            <Box
                border="1px solid"
                borderColor="blackAlpha.300"
                paddingInline={16}
                paddingBlock={8}
                borderRadius="6px"
            >
                <Heading size="md" mb={2}>Login</Heading>
                <form target="" onSubmit={(event) => {
                    event.preventDefault()
                    setError("")
                    setLoading(true)
                    const formData = new FormData(event.currentTarget)
                    const username = formData.get("username") as string
                    const password = formData.get("password") as string
                    api.login(username, password).then((user) => {
                        setLoading(false)
                        if (user) {
                            props.setUser(user)
                        } else {
                            setError("Invalid username or password")
                        }
                    })
                }}>
                    <Fieldset.Root>
                        <Field.Root required>
                            <Input name="username" placeholder="Username" />
                        </Field.Root>
                        <Field.Root required>
                            <Input name="password" type="password" placeholder="Password" />
                        </Field.Root>

                        <Text color="red.400">{error}</Text>

                        <Button type="submit" alignSelf="flex-end" loading={loading}>
                            Login
                        </Button>
                    </Fieldset.Root>
                </form>
            </Box>
        </Flex>
    );
};

export default LoginPage;
