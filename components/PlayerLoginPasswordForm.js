import React from 'react'
import {
  Form,
  Segment
} from 'semantic-ui-react'
import ErrorMessage from './ErrorMessage'

class PlayerLoginPasswordForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor (props) {
    super(props)

    this.state =
    { email: '',
      password: '',
      error: null,
      loading: false
    }
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error })
    }

    this.setState({ loading: false })
  }

  render () {
    const { error, loading } = this.state

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <ErrorMessage error={error} />
          <Form.Input
            required
            name='email'
            placeholder='Email address'
            icon='user'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Input
            required
            name='password'
            placeholder='Password'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Button fluid primary size='large' content='Login' />
        </Segment>
      </Form>
    )
  }
}

export default PlayerLoginPasswordForm
